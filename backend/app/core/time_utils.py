from datetime import datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo
    PERU_TZ = ZoneInfo("America/Lima")
except Exception:
    PERU_TZ = timezone(timedelta(hours=-5))


def obtener_timestamp_servidor() -> datetime:
    try:
        return datetime.now(PERU_TZ).replace(tzinfo=None)
    except Exception:
        return datetime.now(timezone(timedelta(hours=-5))).replace(tzinfo=None)
