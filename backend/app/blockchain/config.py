import os
from pydantic_settings import BaseSettings


class BlockchainConfig(BaseSettings):
    """
    Polygon Amoy Testnet configuration.
    Private key and RPC are kept strictly server-side.
    """
    POLYGON_RPC_URL: str = os.getenv(
        "POLYGON_RPC_URL",
        "https://rpc-amoy.polygon.technology",
    )
    POLYGON_CHAIN_ID: int = int(os.getenv("POLYGON_CHAIN_ID", "80002"))
    POLYGON_CONTRACT_ADDRESS: str = os.getenv(
        "POLYGON_CONTRACT_ADDRESS",
        "0x789A842d0F37a9163f350c370A101C5B529Ae913",  # Configurable contract deployment
    )
    POLYGON_PRIVATE_KEY: str = os.getenv("POLYGON_PRIVATE_KEY", "")
    POLYGON_NETWORK: str = os.getenv("POLYGON_NETWORK", "polygon-amoy")
    POLYGON_EXPLORER_URL: str = os.getenv("POLYGON_EXPLORER_URL", "https://amoy.polygonscan.com")

    # Flag indicating whether a live private key is configured
    @property
    def is_live_configured(self) -> bool:
        return bool(self.POLYGON_PRIVATE_KEY and len(self.POLYGON_PRIVATE_KEY.strip()) >= 64)

    class Config:
        env_file = ".env"
        extra = "ignore"


blockchain_config = BlockchainConfig()
