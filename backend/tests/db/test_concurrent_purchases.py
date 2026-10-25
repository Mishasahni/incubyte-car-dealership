"""Concurrent purchases must never sell more units than are in stock.

Each buyer runs in its own thread with its own database session and open connection, and
a barrier releases them together so their transactions overlap. The service is called
directly because TestClient handles one request at a time; the HTTP 409 mapping is
covered by API-INV-03.
A pass shows this run found no oversell; it cannot prove every interleaving is safe.
"""

import threading
from concurrent.futures import ThreadPoolExecutor

from app.models import Vehicle
from app.services import inventory_service
from tests.factories import make_vehicle

BUYERS = 10
STOCK = 3


def test_concurrent_purchases_never_sell_more_than_the_stock(test_app, db_session):
    """CT-01"""
    vehicle_id = make_vehicle(db_session, quantity=STOCK).id
    start_together = threading.Barrier(BUYERS, timeout=10)

    def buy_one(_: int) -> str:
        with test_app.state.session_factory() as session:
            # Open the connection before the barrier: opening one takes far longer than a
            # purchase, so otherwise late buyers start after early ones have committed and
            # the transactions do not actually overlap.
            session.connection()
            start_together.wait()
            try:
                inventory_service.purchase(session, vehicle_id)
            except inventory_service.OutOfStockError:
                return "out of stock"
            return "sold"

    with ThreadPoolExecutor(max_workers=BUYERS) as pool:
        outcomes = list(pool.map(buy_one, range(BUYERS)))

    db_session.expire_all()
    assert {
        "sold": outcomes.count("sold"),
        "out of stock": outcomes.count("out of stock"),
        "final quantity": db_session.get(Vehicle, vehicle_id).quantity,
    } == {"sold": STOCK, "out of stock": BUYERS - STOCK, "final quantity": 0}
