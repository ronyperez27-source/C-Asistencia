import pytest
from fastapi import HTTPException
from app.services.auth_service import AuthService
from app.repositories.usuario_repository import IUsuarioRepository
from app.models.usuario import Usuario
from app.core.security import SecurityManager
from app.schemas.auth_schema import LoginRequest

class FakeUsuarioRepository(IUsuarioRepository):
    def __init__(self):
        self.usuarios = {
            "admin": Usuario(
                id=1,
                username="admin",
                password_hash=SecurityManager.hash_password("Admin2026!"),
                rol="ADMIN",
                activo=True
            ),
            "operador": Usuario(
                id=2,
                username="operador",
                password_hash=SecurityManager.hash_password("Operador123!"),
                rol="OPERADOR",
                activo=True
            )
        }

    def get_by_username(self, username: str):
        return self.usuarios.get(username)

def _crear_captcha_valido():
    reto = SecurityManager.generate_captcha()
    return reto["captcha_token"], reto["pregunta"]

def test_login_admin_exitoso():
    servicio = AuthService(FakeUsuarioRepository())
    token, respuesta = _crear_captcha_valido()
    
    resultado = servicio.autenticar_administrador(
        LoginRequest(
            username="admin",
            password="Admin2026!",
            captcha_token=token,
            captcha_answer=respuesta
        )
    )
    assert resultado.access_token is not None
    assert resultado.rol == "ADMIN"

def test_login_captcha_incorrecto():
    servicio = AuthService(FakeUsuarioRepository())
    token, _ = _crear_captcha_valido()
    
    with pytest.raises(HTTPException) as exc:
        servicio.autenticar_administrador(
            LoginRequest(
                username="admin",
                password="Admin2026!",
                captcha_token=token,
                captcha_answer="ZZZZZ"
            )
        )
    assert exc.value.status_code == 400

def test_login_contrasena_incorrecta():
    servicio = AuthService(FakeUsuarioRepository())
    token, respuesta = _crear_captcha_valido()
    
    with pytest.raises(HTTPException) as exc:
        servicio.autenticar_administrador(
            LoginRequest(
                username="admin",
                password="WrongPassword",
                captcha_token=token,
                captcha_answer=respuesta
            )
        )
    assert exc.value.status_code == 401

def test_login_usuario_sin_rol_admin():
    servicio = AuthService(FakeUsuarioRepository())
    token, respuesta = _crear_captcha_valido()
    
    with pytest.raises(HTTPException) as exc:
        servicio.autenticar_administrador(
            LoginRequest(
                username="operador",
                password="Operador123!",
                captcha_token=token,
                captcha_answer=respuesta
            )
        )
    assert exc.value.status_code == 403