from datetime import datetime
from zoneinfo import ZoneInfo

PERU_TZ = ZoneInfo("America/Lima")

def obtener_timestamp_servidor() -> datetime:
    return datetime.now(PERU_TZ).replace(tzinfo=None)