from fastapi import HTTPException, status
from app.repositories.usuario_repository import IUsuarioRepository
from app.core.security import SecurityManager
from app.schemas.auth_schema import LoginRequest, TokenResponse

class AuthService:
    def __init__(self, usuario_repo: IUsuarioRepository):
        self.usuario_repo = usuario_repo

    def autenticar_administrador(self, credenciales: LoginRequest) -> TokenResponse:
        if not SecurityManager.verify_captcha(credenciales.captcha_token, credenciales.captcha_answer):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código CAPTCHA incorrecto o expirado"
            )

        usuario = self.usuario_repo.get_by_username(credenciales.username)
        
        if not usuario or not SecurityManager.verify_password(credenciales.password, usuario.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos"
            )

        if usuario.rol != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso restringido únicamente a la Administradora"
            )

        token = SecurityManager.create_access_token(
            data={"sub": usuario.username, "rol": usuario.rol}
        )
        return TokenResponse(access_token=token, rol=usuario.rol)