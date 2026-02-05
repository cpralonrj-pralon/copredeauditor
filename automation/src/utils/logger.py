"""
Sistema de Logging Configurável
"""
import logging
import os
from logging.handlers import RotatingFileHandler
from colorlog import ColoredFormatter


class Logger:
    """Classe para configurar e gerenciar logging da aplicação"""
    
    def __init__(self, name: str, config: dict):
        """
        Inicializa o logger
        
        Args:
            name: Nome do logger
            config: Dicionário de configuração do logging
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, config.get('level', 'INFO')))
        
        # Remover handlers existentes
        self.logger.handlers = []
        
        # Formato
        log_format = config.get('format', '[%(asctime)s] %(levelname)s - %(message)s')
        
        # Handler para console com cores
        if config.get('console', True):
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.DEBUG)
            
            # Formatador colorido para console
            color_formatter = ColoredFormatter(
                "%(log_color)s" + log_format,
                datefmt='%Y-%m-%d %H:%M:%S',
                log_colors={
                    'DEBUG': 'cyan',
                    'INFO': 'green',
                    'WARNING': 'yellow',
                    'ERROR': 'red',
                    'CRITICAL': 'red,bg_white',
                }
            )
            console_handler.setFormatter(color_formatter)
            self.logger.addHandler(console_handler)
        
        # Handler para arquivo com rotação
        log_file = config.get('file')
        if log_file:
            # Criar diretório se não existir
            log_dir = os.path.dirname(log_file)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir, exist_ok=True)
            
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=config.get('max_bytes', 10485760),  # 10MB
                backupCount=config.get('backup_count', 5),
                encoding='utf-8'
            )
            file_handler.setLevel(logging.DEBUG)
            
            # Formatador simples para arquivo
            file_formatter = logging.Formatter(
                log_format,
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
    
    def get_logger(self):
        """Retorna a instância do logger"""
        return self.logger


def setup_logger(name: str, config: dict) -> logging.Logger:
    """
    Função auxiliar para configurar logger
    
    Args:
        name: Nome do logger
        config: Configuração do logging
    
    Returns:
        Logger configurado
    """
    logger_instance = Logger(name, config)
    return logger_instance.get_logger()
