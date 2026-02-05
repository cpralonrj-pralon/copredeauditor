"""
Gerador de HTML - Visualização de Dados
"""
import os
import logging
from typing import Dict
from datetime import datetime
import pandas as pd
from jinja2 import Environment, FileSystemLoader


class HTMLGenerator:
    """Gerador de visualização HTML a partir de DataFrame"""
    
    def __init__(self, config: dict, logger: logging.Logger):
        """
        Inicializa o gerador HTML
        
        Args:
            config: Configuração de visualização
            logger: Logger configurado
        """
        self.config = config
        self.logger = logger
        
        # Setup Jinja2
        template_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'templates'
        )
        self.env = Environment(loader=FileSystemLoader(template_dir))
    
    def generate_html_table(self, df: pd.DataFrame, output_path: str) -> str:
        """
        Gera tabela HTML a partir de DataFrame
        
        Args:
            df: DataFrame com os dados
            output_path: Caminho para salvar o HTML
        
        Returns:
            Caminho do arquivo HTML gerado
        """
        self.logger.info(f"Gerando HTML com {len(df)} registros")
        
        try:
            # Carregar template
            template = self.env.get_template('table_template.html')
            
            # Preparar dados
            columns = self.config.get('columns', list(df.columns))
            
            # Filtrar apenas colunas existentes
            columns = [col for col in columns if col in df.columns]
            
            # Converter DataFrame para lista de dicionários
            data = df[columns].to_dict('records')
            
            # Formatar valores (especialmente datas)
            for row in data:
                for key, value in row.items():
                    if pd.isna(value) or value is None:
                        row[key] = '-'
                    elif isinstance(value, (pd.Timestamp, datetime)):
                        date_format = self.config.get('date_format', '%d/%m/%Y %H:%M')
                        row[key] = value.strftime(date_format)
                    else:
                        row[key] = str(value)
            
            # Contexto para o template
            context = {
                'title': self.config.get('title', 'Relatório de Dados'),
                'timestamp': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
                'columns': columns,
                'data': data,
                'style': self.config.get('style', {}),
                'conditional_colors': self.config.get('conditional_colors', {})
            }
            
            # Renderizar
            html_content = template.render(**context)
            
            # Criar diretório se não existir
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)
            
            # Salvar arquivo
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            self.logger.info(f"✓ HTML gerado: {output_path}")
            return output_path
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar HTML: {e}")
            raise
    
    def preview_in_browser(self, html_path: str):
        """
        Abre o HTML no navegador padrão
        
        Args:
            html_path: Caminho do arquivo HTML
        """
        import webbrowser
        abs_path = os.path.abspath(html_path)
        webbrowser.open(f'file://{abs_path}')
        self.logger.info(f"HTML aberto no navegador: {abs_path}")


# Para testes
if __name__ == "__main__":
    import yaml
    from src.utils.logger import setup_logger
    
    # Carregar config
    with open('config.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    logger = setup_logger('html_generator_test', config['logging'])
    
    # Dados de teste
    test_data = pd.DataFrame({
        'data': ['03/02/2026 08:00', '03/02/2026 09:00', '03/02/2026 10:00'],
        'status': ['Pendente', 'Em Fila', 'Crítico'],
        'area': ['TI', 'Operações', 'Suporte'],
        'descricao': ['Teste 1', 'Teste 2', 'Teste 3'],
        'responsavel': ['João', 'Maria', 'Pedro']
    })
    
    generator = HTMLGenerator(config['visualization'], logger)
    html_file = generator.generate_html_table(test_data, 'output/test.html')
    
    logger.info(f"✓ Teste concluído: {html_file}")
    generator.preview_in_browser(html_file)
