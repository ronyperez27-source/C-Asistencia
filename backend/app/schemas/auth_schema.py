from pydantic import BaseModel, Field

class CaptchaResponse(BaseModel):
    pregunta: str
    captcha_token: str

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    captcha_token: str
    captcha_answer: str = Field(..., min_length=1, max_length=10)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str