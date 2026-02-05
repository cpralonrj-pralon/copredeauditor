"""
Envio de Mensagens via WhatsApp
Suporta múltiplos métodos: n8n webhook, Evolution API, WhatsApp Official API
"""
import os
import logging
from typing import Optional
import requests
from tenacity import retry, stop_after_attempt, wait_exponential


class WhatsAppSender:
    """Cliente para envio de mensagens via WhatsApp"""
    
    def __init__(self, config: dict, logger: logging.Logger):
        """
        Inicializa o sender do WhatsApp
        
        Args:
            config: Configuração do WhatsApp
            logger: Logger configurado
        """
        self.config = config
        self.logger = logger
        self.method = config.get('method', 'n8n_webhook')
        self.recipient = config.get('recipient')
        
        if not self.recipient:
            raise ValueError("Número do destinatário não configurado")
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    def send_image(self, image_path: str, caption: Optional[str] = None) -> bool:
        """
        Envia imagem via WhatsApp
        
        Args:
            image_path: Caminho da imagem
            caption: Legenda da mensagem (opcional)
        
        Returns:
            True se enviado com sucesso
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Imagem não encontrada: {image_path}")
        
        # Gerar caption padrão se não fornecido
        if caption is None:
            from datetime import datetime
            caption_template = self.config.get('caption', 'Relatório - {timestamp}')
            caption = caption_template.format(timestamp=datetime.now().strftime('%d/%m/%Y %H:%M'))
        
        self.logger.info(f"Enviando imagem para {self.recipient} via {self.method}")
        
        # Escolher método de envio
        if self.method == 'n8n_webhook':
            return self._send_via_n8n(image_path, caption)
        elif self.method == 'evolution_api':
            return self._send_via_evolution(image_path, caption)
        elif self.method == 'official_api':
            return self._send_via_official(image_path, caption)
        else:
            raise ValueError(f"Método de envio não suportado: {self.method}")
    
    def _send_via_n8n(self, image_path: str, caption: str) -> bool:
        """
        Envia via webhook n8n
        
        Args:
            image_path: Caminho da imagem
            caption: Legenda
        
        Returns:
            True se sucesso
        """
        webhook_url = self.config.get('n8n', {}).get('webhook_url')
        
        if not webhook_url:
            raise ValueError("URL do webhook n8n não configurada")
        
        try:
            # Preparar arquivo
            with open(image_path, 'rb') as f:
                files = {'file': (os.path.basename(image_path), f, 'image/png')}
                
                # Dados adicionais
                data = {
                    'phone': self.recipient,
                    'caption': caption
                }
                
                # Enviar
                response = requests.post(
                    webhook_url,
                    files=files,
                    data=data,
                    timeout=30
                )
                
                response.raise_for_status()
                
                self.logger.info(f"✓ Imagem enviada com sucesso via n8n webhook")
                return True
                
        except Exception as e:
            self.logger.error(f"Erro ao enviar via n8n: {e}")
            raise
    
    def _send_via_evolution(self, image_path: str, caption: str) -> bool:
        """
        Envia via Evolution API
        
        Args:
            image_path: Caminho da imagem
            caption: Legenda
        
        Returns:
            True se sucesso
        """
        evolution_config = self.config.get('evolution', {})
        base_url = evolution_config.get('base_url')
        instance = evolution_config.get('instance')
        api_key = evolution_config.get('api_key')
        
        if not all([base_url, instance, api_key]):
            raise ValueError("Configuração incompleta para Evolution API")
        
        try:
            # Ler imagem como base64
            import base64
            with open(image_path, 'rb') as f:
                image_b64 = base64.b64encode(f.read()).decode('utf-8')
            
            # Endpoint
            url = f"{base_url.rstrip('/')}/message/sendMedia/{instance}"
            
            # Headers
            headers = {
                'Content-Type': 'application/json',
                'apikey': api_key
            }
            
            # Payload
            payload = {
                'number': self.recipient,
                'mediatype': 'image',
                'mimetype': 'image/png',
                'caption': caption,
                'media': f"data:image/png;base64,{image_b64}"
            }
            
            # Enviar
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            self.logger.info(f"✓ Imagem enviada com sucesso via Evolution API")
            return True
            
        except Exception as e:
            self.logger.error(f"Erro ao enviar via Evolution API: {e}")
            raise
    
    def _send_via_official(self, image_path: str, caption: str) -> bool:
        """
        Envia via WhatsApp Official API
        
        Args:
            image_path: Caminho da imagem
            caption: Legenda
        
        Returns:
            True se sucesso
        """
        official_config = self.config.get('official', {})
        phone_number_id = official_config.get('phone_number_id')
        access_token = official_config.get('access_token')
        
        if not all([phone_number_id, access_token]):
            raise ValueError("Configuração incompleta para WhatsApp Official API")
        
        try:
            # Primeiro: fazer upload da mídia
            upload_url = f"https://graph.facebook.com/v18.0/{phone_number_id}/media"
            
            headers = {
                'Authorization': f'Bearer {access_token}'
            }
            
            with open(image_path, 'rb') as f:
                files = {
                    'file': (os.path.basename(image_path), f, 'image/png'),
                }
                data = {
                    'messaging_product': 'whatsapp'
                }
                
                upload_response = requests.post(
                    upload_url,
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=30
                )
                upload_response.raise_for_status()
                media_id = upload_response.json()['id']
            
            # Segundo: enviar mensagem com mídia
            message_url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
            
            payload = {
                'messaging_product': 'whatsapp',
                'recipient_type': 'individual',
                'to': self.recipient,
                'type': 'image',
                'image': {
                    'id': media_id,
                    'caption': caption
                }
            }
            
            message_response = requests.post(
                message_url,
                headers={**headers, 'Content-Type': 'application/json'},
                json=payload,
                timeout=30
            )
            message_response.raise_for_status()
            
            self.logger.info(f"✓ Imagem enviada com sucesso via WhatsApp Official API")
            return True
            
        except Exception as e:
            self.logger.error(f"Erro ao enviar via WhatsApp Official API: {e}")
            raise


# Para testes
if __name__ == "__main__":
    import yaml
    from src.utils.logger import setup_logger
    
    # Carregar config
    with open('config.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    logger = setup_logger('whatsapp_test', config['logging'])
    
    sender = WhatsAppSender(config['whatsapp'], logger)
    
    # Teste (requer imagem existente e configuração válida)
    test_image = 'output/screenshot.png'
    if os.path.exists(test_image):
        try:
            sender.send_image(test_image, "📊 Teste de envio automático")
            logger.info("✓ Teste concluído com sucesso")
        except Exception as e:
            logger.error(f"✗ Teste falhou: {e}")
    else:
        logger.error(f"Imagem de teste não encontrada: {test_image}")
