from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.auth_schema import LoginRequest, TokenResponse, CaptchaResponse
from app.services.auth_service import AuthService
from app.repositories.usuario_repository import IUsuarioRepository, SQLServerUsuarioRepository
from app.core.security import SecurityManager
from app.core.database import get_db

router = APIRouter(prefix="/auth", tags=["Autenticación"])

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    repo: IUsuarioRepository = SQLServerUsuarioRepository(db)
    return AuthService(repo)

@router.get("/captcha", response_model=CaptchaResponse)
def obtener_captcha():
    return SecurityManager.generate_captcha()

@router.post("/login", response_model=TokenResponse)
def login(credenciales: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return service.autenticar_administrador(credenciales)