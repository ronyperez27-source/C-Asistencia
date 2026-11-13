from datetime import datetime, timedelta, timezone
import random
import bcrypt
from jose import jwt, JWTError
from app.core.config import get_settings

settings = get_settings()

class SecurityManager:
    @staticmethod
    def hash_password(password: str) -> str:
        pwd_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def generate_captcha() -> dict:
        caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        codigo = "".join(random.choices(caracteres, k=5))
        
        expire = datetime.now(timezone.utc) + timedelta(minutes=5)
        token = jwt.encode(
            {"captcha_ans": codigo, "exp": expire},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return {"pregunta": codigo, "captcha_token": token}

    @staticmethod
    def verify_captcha(captcha_token: str, user_answer: str) -> bool:
        try:
            payload = jwt.decode(captcha_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload.get("captcha_ans", "").upper() == user_answer.strip().upper()
        except JWTError:
            return False