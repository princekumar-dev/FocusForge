import logging
import os
from typing import Any
from pathlib import Path
from dotenv import load_dotenv

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# Load environment variables from workspace root `.env` so local runs pick them up
# `parents[2]` moves up from backend/core -> backend -> workspace root
env_path = Path(__file__).parents[2] / ".env"
if env_path.exists():
    load_dotenv(env_path, override=False)


class Settings(BaseSettings):
    # Application
    app_name: str = "FastAPI Modular Template"
    debug: bool = False
    version: str = "1.0.0"
    database_url: str = ""


    # Server
    host: str = "0.0.0.0"
    port: int = 3001

    # AWS Lambda Configuration
    is_lambda: bool = False
    lambda_function_name: str = "fastapi-backend"
    aws_region: str = "us-east-1"
    oidc_client_id: str = "mock-client-id"
    oidc_client_secret: str = ""
    oidc_issuer_url: str = "https://mock-issuer.com"
    oidc_scope: str = "openid email profile"
    frontend_url: str = "http://127.0.0.1:3000"
    jwt_secret_key: str = "mock-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    admin_user_id: str = ""
    admin_user_email: str = ""
    clerk_frontend_url: str = "https://loving-beetle-85.clerk.accounts.dev"
    clerk_backend_url: str = "https://api.clerk.com"
    clerk_secret_key: str = ""
    clerk_jwks_public_key: str = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtemkkIEzccPEIyEg8sjS
uvqLZplH7LEl+09xvOH8BMIfJiZnfUSewcZO4NsfKd4ARLKiwJwWxt13+V+1Ozey
dmoMfdXLQxuPegjAvb8yHVWAisYMpPwRB13/KFF3KwQpUdJivMqIlMowgP9+Ufgl
hepOpN2khGlLYt2EmQMHhJLMCtc6RQNTvN+8HPYhpc+csDEEXGksFBF1wh9ROtYv
2L9KDwU7X45ucNAqFcdo+sCskgEfDyfG9Ol3utdeB+/otlr3HgE8nIQ1WU6HyhHc
MEFqWQ+iDSqLfFkloUul2ZqyFLEnqQIza6vj8qnelsHV5dA4yzXj8m45i6KYNfVF
eQIDAQAB
-----END PUBLIC KEY-----"""

    @property
    def backend_url(self) -> str:
        """Generate backend URL from host and port."""
        if self.is_lambda:
            # In Lambda environment, return the API Gateway URL
            return os.environ.get(
                "PYTHON_BACKEND_URL", f"https://{self.lambda_function_name}.execute-api.{self.aws_region}.amazonaws.com"
            )
        else:
            # Use localhost for external callbacks instead of 0.0.0.0
            display_host = "127.0.0.1" if self.host == "0.0.0.0" else self.host
            return os.environ.get("PYTHON_BACKEND_URL", f"http://{display_host}:{self.port}")

    class Config:
        case_sensitive = False
        extra = "ignore"
        # Ensure pydantic reads the workspace .env file for local development
        env_file = str(Path(__file__).parents[2] / ".env")
        env_file_encoding = "utf-8"

    def __getattr__(self, name: str) -> Any:
        """
        Dynamically read attributes from environment variables.
        For example: settings.opapi_key reads from OPAPI_KEY environment variable.

        Args:
            name: Attribute name (e.g., 'opapi_key')

        Returns:
            Value from environment variable

        Raises:
            AttributeError: If attribute doesn't exist and not found in environment variables
        """
        # Convert attribute name to environment variable name (snake_case -> UPPER_CASE)
        env_var_name = name.upper()

        # Check if environment variable exists
        if env_var_name in os.environ:
            value = os.environ[env_var_name]
            # Cache the value in instance dict to avoid repeated lookups
            self.__dict__[name] = value
            logger.debug(f"Read dynamic attribute {name} from environment variable {env_var_name}")
            return value

        # If not found, raise AttributeError to maintain normal Python behavior
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")


# Global settings instance
settings = Settings()
