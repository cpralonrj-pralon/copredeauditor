"""
Web Scraper para Fonte 1 - Download de Planilha
"""
import os
import time
from typing import Optional
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from tenacity import retry, stop_after_attempt, wait_exponential


class WebScraper:
    """Web Scraper usando Selenium para download de planilhas"""
    
    def __init__(self, config: dict, logger: logging.Logger):
        """
        Inicializa o Web Scraper
        
        Args:
            config: Configuração da Fonte 1
            logger: Logger configurado
        """
        self.config = config
        self.logger = logger
        self.driver = None
        self.downloads_dir = None
    
    def _setup_driver(self, downloads_dir: str):
        """
        Configura o driver do Selenium
        
        Args:
            downloads_dir: Diretório para downloads
        """
        self.downloads_dir = os.path.abspath(downloads_dir)
        
        # Criar diretório se não existir
        os.makedirs(self.downloads_dir, exist_ok=True)
        
        # Opções do Chrome
        chrome_options = Options()
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Configurar diretório de download
        prefs = {
            "download.default_directory": self.downloads_dir,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True
        }
        chrome_options.add_experimental_option("prefs", prefs)
        
        # Inicializar driver
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.logger.info("Driver Selenium inicializado")
    
    def _login(self):
        """Realiza login se necessário"""
        if not self.config.get('login_required', False):
            return
        
        username = self.config.get('username')
        password = self.config.get('password')
        
        if not username or not password:
            self.logger.warning("Login requerido mas credenciais não fornecidas")
            return
        
        # Implementar lógica de login aqui
        # Este é um exemplo genérico - ajustar conforme o site
        try:
            # Localizar campos de login (ajustar seletores)
            username_field = self.driver.find_element(By.ID, "username")
            password_field = self.driver.find_element(By.ID, "password")
            login_button = self.driver.find_element(By.ID, "login")
            
            username_field.send_keys(username)
            password_field.send_keys(password)
            login_button.click()
            
            # Aguardar redirecionamento
            time.sleep(3)
            self.logger.info("Login realizado com sucesso")
            
        except Exception as e:
            self.logger.error(f"Erro ao fazer login: {e}")
            raise
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    def download_spreadsheet(self, downloads_dir: str) -> Optional[str]:
        """
        Navega até o site e baixa a planilha
        
        Args:
            downloads_dir: Diretório para salvar o download
        
        Returns:
            Caminho do arquivo baixado ou None
        """
        try:
            self._setup_driver(downloads_dir)
            
            url = self.config.get('url')
            if not url:
                raise ValueError("URL não configurada para Fonte 1")
            
            self.logger.info(f"Acessando {url}")
            self.driver.get(url)
            
            # Aguardar carregamento da página
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Realizar login se necessário
            self._login()
            
            # AJUSTAR: Localizar e clicar no botão de download
            # Este é um exemplo genérico - ajustar os seletores conforme o site real
            try:
                # Exemplo 1: Botão com ID específico
                download_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Download')]"))
                )
                download_button.click()
                self.logger.info("Botão de download clicado")
                
            except Exception as e:
                self.logger.warning(f"Não foi possível localizar botão de download padrão: {e}")
                # Exemplo 2: Link direto para arquivo
                download_link = self.driver.find_element(By.XPATH, "//a[contains(@href, '.xlsx') or contains(@href, '.xls')]")
                download_link.click()
            
            # Aguardar download
            wait_seconds = self.config.get('download_wait_seconds', 10)
            self.logger.info(f"Aguardando {wait_seconds}s para conclusão do download")
            time.sleep(wait_seconds)
            
            # Encontrar arquivo baixado
            downloaded_file = self._get_latest_download()
            
            if downloaded_file:
                self.logger.info(f"Planilha baixada com sucesso: {downloaded_file}")
                return downloaded_file
            else:
                self.logger.error("Nenhum arquivo foi baixado")
                return None
                
        except Exception as e:
            self.logger.error(f"Erro ao baixar planilha: {e}")
            raise
        
        finally:
            self.close()
    
    def _get_latest_download(self) -> Optional[str]:
        """
        Obtém o arquivo mais recente no diretório de downloads
        
        Returns:
            Caminho do arquivo ou None
        """
        files = [
            os.path.join(self.downloads_dir, f) 
            for f in os.listdir(self.downloads_dir)
            if f.endswith(('.xlsx', '.xls', '.csv'))
        ]
        
        if not files:
            return None
        
        # Arquivo mais recente
        latest_file = max(files, key=os.path.getctime)
        return latest_file
    
    def close(self):
        """Fecha o driver"""
        if self.driver:
            self.driver.quit()
            self.logger.info("Driver Selenium fechado")


# Para testes
if __name__ == "__main__":
    import yaml
    from src.utils.logger import setup_logger
    
    # Carregar config
    with open('config.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    logger = setup_logger('web_scraper_test', config['logging'])
    
    scraper = WebScraper(config['fonte1'], logger)
    file_path = scraper.download_spreadsheet(config['paths']['downloads_dir'])
    
    if file_path:
        logger.info(f"✓ Teste concluído. Arquivo: {file_path}")
    else:
        logger.error("✗ Teste falhou")
