"""
Captura de Screenshot usando Selenium
"""
import os
import time
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager


class ScreenshotMaker:
    """Captura screenshots de páginas HTML"""
    
    def __init__(self, config: dict, logger: logging.Logger):
        """
        Inicializa o capturador de screenshots
        
        Args:
            config: Configuração de screenshot
            logger: Logger configurado
        """
        self.config = config
        self.logger = logger
        self.driver = None
    
    def _setup_driver(self):
        """Configura o driver do Selenium para screenshot"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Modo sem interface
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        
        # Configurar tamanho da janela
        width = self.config.get('width', 1920)
        height = self.config.get('height', 1080)
        chrome_options.add_argument(f'--window-size={width},{height}')
        
        # Alta resolução
        scale = self.config.get('scale', 2)
        chrome_options.add_argument(f'--force-device-scale-factor={scale}')
        
        # Inicializar driver
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
        self.logger.info(f"Driver configurado: {width}x{height} (escala {scale}x)")
    
    def capture_html_table(self, html_path: str, output_path: Optional[str] = None) -> str:
        """
        Captura screenshot de uma tabela HTML
        
        Args:
            html_path: Caminho do arquivo HTML
            output_path: Caminho para salvar o screenshot (usa config se None)
        
        Returns:
            Caminho do arquivo de imagem gerado
        """
        if output_path is None:
            output_path = self.config.get('output_path', 'output/screenshot.png')
        
        self.logger.info(f"Capturando screenshot de: {html_path}")
        
        try:
            # Setup driver
            self._setup_driver()
            
            # Converter para URL absoluta
            html_abs_path = os.path.abspath(html_path)
            html_url = f"file:///{html_abs_path.replace(os.sep, '/')}"
            
            # Abrir página
            self.driver.get(html_url)
            
            # Aguardar renderização
            wait_seconds = self.config.get('wait_seconds', 2)
            time.sleep(wait_seconds)
            
            # Criar diretório se não existir
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)
            
            # Capturar screenshot completo
            self.driver.save_screenshot(output_path)
            
            # Verificar se arquivo foi criado
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                self.logger.info(f"✓ Screenshot capturado: {output_path} ({file_size / 1024:.1f} KB)")
                return output_path
            else:
                raise Exception("Arquivo de screenshot não foi criado")
            
        except Exception as e:
            self.logger.error(f"Erro ao capturar screenshot: {e}")
            raise
        
        finally:
            self.close()
    
    def capture_element(self, html_path: str, element_id: str, output_path: Optional[str] = None) -> str:
        """
        Captura screenshot de um elemento específico
        
        Args:
            html_path: Caminho do arquivo HTML
            element_id: ID do elemento a capturar
            output_path: Caminho para salvar o screenshot
        
        Returns:
            Caminho do arquivo de imagem gerado
        """
        if output_path is None:
            output_path = self.config.get('output_path', 'output/screenshot.png')
        
        self.logger.info(f"Capturando elemento #{element_id} de: {html_path}")
        
        try:
            # Setup driver
            self._setup_driver()
            
            # Converter para URL absoluta
            html_abs_path = os.path.abspath(html_path)
            html_url = f"file:///{html_abs_path.replace(os.sep, '/')}"
            
            # Abrir página
            self.driver.get(html_url)
            
            # Aguardar renderização
            wait_seconds = self.config.get('wait_seconds', 2)
            time.sleep(wait_seconds)
            
            # Localizar elemento
            from selenium.webdriver.common.by import By
            element = self.driver.find_element(By.ID, element_id)
            
            # Criar diretório se não existir
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)
            
            # Capturar screenshot do elemento
            element.screenshot(output_path)
            
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                self.logger.info(f"✓ Screenshot do elemento capturado: {output_path} ({file_size / 1024:.1f} KB)")
                return output_path
            else:
                raise Exception("Arquivo de screenshot não foi criado")
            
        except Exception as e:
            self.logger.error(f"Erro ao capturar screenshot do elemento: {e}")
            raise
        
        finally:
            self.close()
    
    def close(self):
        """Fecha o driver"""
        if self.driver:
            self.driver.quit()
            self.logger.info("Driver fechado")


# Para testes
if __name__ == "__main__":
    import yaml
    from src.utils.logger import setup_logger
    
    # Carregar config
    with open('config.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    logger = setup_logger('screenshot_test', config['logging'])
    
    maker = ScreenshotMaker(config['screenshot'], logger)
    
    # Teste (requer HTML existente)
    html_file = 'output/test.html'
    if os.path.exists(html_file):
        screenshot = maker.capture_html_table(html_file)
        logger.info(f"✓ Teste concluído: {screenshot}")
    else:
        logger.error(f"Arquivo HTML de teste não encontrado: {html_file}")
