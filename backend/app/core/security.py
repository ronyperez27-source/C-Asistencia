from datetime import datetime, timedelta, timezone
import random
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from app.core.config import get_settings

settings = get_settings()

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Valida el JWT enviado en `Authorization: Bearer <token>`."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin usuario válido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


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