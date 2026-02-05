"""
Cliente de API REST para Fonte 2
"""
import logging
from typing import Dict, List, Any, Optional
import requests
from tenacity import retry, stop_after_attempt, wait_exponential


class APIClient:
    """Cliente para consumir API REST"""
    
    def __init__(self, config: dict, logger: logging.Logger):
        """
        Inicializa o cliente da API
        
        Args:
            config: Configuração da Fonte 2
            logger: Logger configurado
        """
        self.config = config
        self.logger = logger
        self.base_url = config.get('base_url', '').rstrip('/')
        self.session = requests.Session()
        self._setup_auth()
    
    def _setup_auth(self):
        """Configura autenticação da API"""
        auth_type = self.config.get('auth_type', 'bearer')
        
        if auth_type == 'bearer':
            token = self.config.get('token')
            if token:
                self.session.headers.update({
                    'Authorization': f'Bearer {token}'
                })
                self.logger.info("Autenticação Bearer configurada")
        
        elif auth_type == 'api_key':
            header = self.config.get('api_key_header', 'X-API-Key')
            key = self.config.get('api_key_value')
            if key:
                self.session.headers.update({header: key})
                self.logger.info(f"Autenticação API Key configurada ({header})")
        
        elif auth_type == 'basic':
            username = self.config.get('username')
            password = self.config.get('password')
            if username and password:
                self.session.auth = (username, password)
                self.logger.info("Autenticação Basic configurada")
        
        # Headers adicionais
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """
        Faz requisição HTTP com retry
        
        Args:
            method: Método HTTP (GET, POST, etc.)
            endpoint: Endpoint da API
            **kwargs: Argumentos adicionais para requests
        
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        timeout = self.config.get('timeout', 30)
        
        self.logger.debug(f"{method} {url}")
        
        response = self.session.request(
            method=method,
            url=url,
            timeout=timeout,
            **kwargs
        )
        
        response.raise_for_status()
        return response
    
    def fetch_data(self, endpoint: Optional[str] = None, params: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """
        Busca dados da API com suporte a paginação
        
        Args:
            endpoint: Endpoint específico (usa default do config se None)
            params: Parâmetros de query adicionais
        
        Returns:
            Lista de registros
        """
        if endpoint is None:
            endpoint = self.config.get('endpoints', {}).get('data', '/dados')
        
        params = params or {}
        all_data = []
        
        # Verificar se paginação está habilitada
        pagination = self.config.get('pagination', {})
        use_pagination = pagination.get('enabled', False)
        
        if use_pagination:
            page_param = pagination.get('page_param', 'page')
            per_page_param = pagination.get('per_page_param', 'per_page')
            per_page = pagination.get('per_page', 100)
            max_pages = pagination.get('max_pages', 10)
            
            # Paginação
            current_page = 1
            
            while current_page <= max_pages:
                params[page_param] = current_page
                params[per_page_param] = per_page
                
                self.logger.info(f"Buscando página {current_page}")
                
                try:
                    response = self._make_request('GET', endpoint, params=params)
                    data = response.json()
                    
                    # Extrair dados (ajustar conforme estrutura da API)
                    if isinstance(data, list):
                        records = data
                    elif isinstance(data, dict):
                        # Tentar encontrar lista de registros
                        records = (
                            data.get('data') or 
                            data.get('results') or 
                            data.get('items') or 
                            []
                        )
                    else:
                        records = []
                    
                    if not records:
                        self.logger.info("Nenhum registro retornado, finalizando paginação")
                        break
                    
                    all_data.extend(records)
                    self.logger.info(f"✓ {len(records)} registros obtidos (total: {len(all_data)})")
                    
                    # Verificar se há mais páginas
                    if len(records) < per_page:
                        self.logger.info("Última página alcançada")
                        break
                    
                    current_page += 1
                    
                except Exception as e:
                    self.logger.error(f"Erro ao buscar página {current_page}: {e}")
                    break
        
        else:
            # Sem paginação - uma única requisição
            try:
                response = self._make_request('GET', endpoint, params=params)
                data = response.json()
                
                if isinstance(data, list):
                    all_data = data
                elif isinstance(data, dict):
                    all_data = (
                        data.get('data') or 
                        data.get('results') or 
                        data.get('items') or 
                        []
                    )
                
                self.logger.info(f"✓ {len(all_data)} registros obtidos")
                
            except Exception as e:
                self.logger.error(f"Erro ao buscar dados: {e}")
                raise
        
        return all_data
    
    def close(self):
        """Fecha a sessão"""
        self.session.close()
        self.logger.info("Sessão API fechada")


# Para testes
if __name__ == "__main__":
    import yaml
    from src.utils.logger import setup_logger
    
    # Carregar config
    with open('config.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    logger = setup_logger('api_client_test', config['logging'])
    
    client = APIClient(config['fonte2'], logger)
    data = client.fetch_data()
    
    logger.info(f"✓ Teste concluído. {len(data)} registros obtidos")
    client.close()
