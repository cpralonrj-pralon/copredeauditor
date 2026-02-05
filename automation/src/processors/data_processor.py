"""
Processador de Dados - Normalização e Unificação
"""
import logging
from typing import Dict, List, Any, Optional
import pandas as pd
import pytz
from datetime import datetime


class DataProcessor:
    """Processador para normalizar e unificar dados de múltiplas fontes"""
    
    def __init__(self, config: dict, logger: logging.Logger):
        """
        Inicializa o processador
        
        Args:
            config: Configuração de processamento
            logger: Logger configurado
        """
        self.config = config
        self.logger = logger
        self.timezone = pytz.timezone(config.get('timezone', 'America/Sao_Paulo'))
    
    def load_excel_data(self, file_path: str) -> pd.DataFrame:
        """
        Carrega dados de planilha Excel/CSV
        
        Args:
            file_path: Caminho do arquivo
        
        Returns:
            DataFrame com os dados
        """
        self.logger.info(f"Carregando planilha: {file_path}")
        
        try:
            # Detectar tipo de arquivo
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, encoding='utf-8-sig')
            else:
                df = pd.read_excel(file_path, engine='openpyxl')
            
            self.logger.info(f"✓ Planilha carregada: {len(df)} linhas, {len(df.columns)} colunas")
            return df
            
        except Exception as e:
            self.logger.error(f"Erro ao carregar planilha: {e}")
            raise
    
    def process_api_data(self, data: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Converte dados JSON da API em DataFrame
        
        Args:
            data: Lista de dicionários da API
        
        Returns:
            DataFrame normalizado
        """
        self.logger.info(f"Convertendo {len(data)} registros da API em DataFrame")
        
        try:
            df = pd.DataFrame(data)
            self.logger.info(f"✓ DataFrame criado: {len(df)} linhas, {len(df.columns)} colunas")
            return df
            
        except Exception as e:
            self.logger.error(f"Erro ao converter dados da API: {e}")
            raise
    
    def normalize_columns(self, df: pd.DataFrame, source: str) -> pd.DataFrame:
        """
        Normaliza nomes de colunas conforme mapeamento
        
        Args:
            df: DataFrame original
            source: 'fonte1' ou 'fonte2'
        
        Returns:
            DataFrame com colunas normalizadas
        """
        mapping = self.config.get('column_mapping', {}).get(source, {})
        
        if not mapping:
            self.logger.warning(f"Nenhum mapeamento de colunas definido para {source}")
            return df
        
        # Renomear colunas
        df_normalized = df.rename(columns=mapping)
        
        # Log das colunas renomeadas
        renamed = [f"{old} → {new}" for old, new in mapping.items() if old in df.columns]
        if renamed:
            self.logger.info(f"Colunas normalizadas: {', '.join(renamed)}")
        
        return df_normalized
    
    def translate_status(self, df: pd.DataFrame, column: str = 'status') -> pd.DataFrame:
        """
        Traduz códigos técnicos de status para valores legíveis
        
        Args:
            df: DataFrame
            column: Nome da coluna de status
        
        Returns:
            DataFrame com status traduzidos
        """
        if column not in df.columns:
            self.logger.warning(f"Coluna '{column}' não encontrada no DataFrame")
            return df
        
        translation = self.config.get('status_translation', {})
        
        if not translation:
            return df
        
        # Aplicar tradução
        df[column] = df[column].map(lambda x: translation.get(str(x).upper(), x))
        
        self.logger.info(f"✓ Status traduzidos na coluna '{column}'")
        return df
    
    def normalize_dates(self, df: pd.DataFrame, date_columns: Optional[List[str]] = None) -> pd.DataFrame:
        """
        Normaliza colunas de data para formato padrão
        
        Args:
            df: DataFrame
            date_columns: Lista de colunas de data (auto-detecta se None)
        
        Returns:
            DataFrame com datas normalizadas
        """
        if date_columns is None:
            # Auto-detectar colunas com 'data' ou 'date' no nome
            date_columns = [col for col in df.columns if 'data' in col.lower() or 'date' in col.lower()]
        
        date_format = self.config.get('date_format', '%d/%m/%Y %H:%M')
        
        for col in date_columns:
            if col not in df.columns:
                continue
            
            try:
                # Converter para datetime
                df[col] = pd.to_datetime(df[col], errors='coerce')
                
                # Aplicar timezone
                if df[col].dt.tz is None:
                    df[col] = df[col].dt.tz_localize(self.timezone)
                else:
                    df[col] = df[col].dt.tz_convert(self.timezone)
                
                self.logger.info(f"✓ Coluna '{col}' normalizada para datetime com timezone {self.timezone}")
                
            except Exception as e:
                self.logger.warning(f"Erro ao normalizar data na coluna '{col}': {e}")
        
        return df
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Trata valores nulos e ausentes
        
        Args:
            df: DataFrame
        
        Returns:
            DataFrame com valores nulos tratados
        """
        # Log inicial
        null_counts = df.isnull().sum()
        if null_counts.sum() > 0:
            self.logger.info(f"Valores nulos encontrados:\n{null_counts[null_counts > 0]}")
        
        # Preencher nulos em colunas de texto com string vazia
        text_columns = df.select_dtypes(include=['object']).columns
        df[text_columns] = df[text_columns].fillna('')
        
        # Preencher nulos em colunas numéricas com 0
        numeric_columns = df.select_dtypes(include=['number']).columns
        df[numeric_columns] = df[numeric_columns].fillna(0)
        
        self.logger.info("✓ Valores nulos tratados")
        return df
    
    def merge_datasets(self, df1: pd.DataFrame, df2: pd.DataFrame) -> pd.DataFrame:
        """
        Unifica datasets de Fonte 1 e Fonte 2
        
        Args:
            df1: DataFrame da Fonte 1
            df2: DataFrame da Fonte 2
        
        Returns:
            DataFrame consolidado
        """
        self.logger.info(f"Unificando datasets: Fonte1({len(df1)} linhas) + Fonte2({len(df2)} linhas)")
        
        # Adicionar coluna de origem
        df1['fonte'] = 'Fonte 1'
        df2['fonte'] = 'Fonte 2'
        
        # Garantir que ambos tenham as mesmas colunas
        all_columns = set(df1.columns) | set(df2.columns)
        
        for col in all_columns:
            if col not in df1.columns:
                df1[col] = None
            if col not in df2.columns:
                df2[col] = None
        
        # Concatenar
        df_merged = pd.concat([df1, df2], ignore_index=True)
        
        # Remover duplicatas (se houver)
        df_merged = df_merged.drop_duplicates()
        
        self.logger.info(f"✓ Datasets unificados: {len(df_merged)} linhas totais")
        return df_merged
    
    def process_full_pipeline(self, excel_file: str, api_data: List[Dict]) -> pd.DataFrame:
        """
        Pipeline completo de processamento
        
        Args:
            excel_file: Caminho da planilha (Fonte 1)
            api_data: Dados da API (Fonte 2)
        
        Returns:
            DataFrame processado e unificado
        """
        self.logger.info("=== Iniciando pipeline de processamento ===")
        
        # 1. Carregar Fonte 1
        df1 = self.load_excel_data(excel_file)
        df1 = self.normalize_columns(df1, 'fonte1')
        
        # 2. Processar Fonte 2
        df2 = self.process_api_data(api_data)
        df2 = self.normalize_columns(df2, 'fonte2')
        
        # 3. Unificar
        df_merged = self.merge_datasets(df1, df2)
        
        # 4. Normalizar datas
        df_merged = self.normalize_dates(df_merged)
        
        # 5. Traduzir status
        df_merged = self.translate_status(df_merged)
        
        # 6. Tratar valores nulos
        df_merged = self.handle_missing_values(df_merged)
        
        self.logger.info(f"=== Pipeline concluído: {len(df_merged)} registros finais ===")
        return df_merged
    
    def filter_columns(self, df: pd.DataFrame, columns: Optional[List[str]] = None) -> pd.DataFrame:
        """
        Filtra apenas as colunas desejadas para visualização
        
        Args:
            df: DataFrame completo
            columns: Lista de colunas desejadas (usa config se None)
        
        Returns:
            DataFrame filtrado
        """
        if columns is None:
            columns = self.config.get('columns', list(df.columns))
        
        # Manter apenas colunas que existem
        available_columns = [col for col in columns if col in df.columns]
        
        if len(available_columns) < len(columns):
            missing = set(columns) - set(available_columns)
            self.logger.warning(f"Colunas não encontradas: {missing}")
        
        df_filtered = df[available_columns]
        self.logger.info(f"✓ DataFrame filtrado: {len(available_columns)} colunas")
        
        return df_filtered


# Para testes
if __name__ == "__main__":
    import yaml
    from src.utils.logger import setup_logger
    
    # Carregar config
    with open('config.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    logger = setup_logger('data_processor_test', config['logging'])
    
    processor = DataProcessor(config['processing'], logger)
    
    # Teste com dados mock
    mock_api_data = [
        {"timestamp": "2026-02-03 08:00", "state": "PENDING", "description": "Teste 1", "department": "TI"},
        {"timestamp": "2026-02-03 09:00", "state": "CRITICAL", "description": "Teste 2", "department": "Operações"}
    ]
    
    df = processor.process_api_data(mock_api_data)
    df = processor.normalize_columns(df, 'fonte2')
    df = processor.translate_status(df)
    
    logger.info(f"✓ Teste concluído\n{df}")
