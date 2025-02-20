from sqlalchemy import create_engine
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Criando a aplicação FastAPI
app = FastAPI()

# Configuração do CORS para permitir acesso de qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite qualquer origem
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permite qualquer cabeçalho
)


# URL de conexão com o banco de dados
DB_URL = "postgresql://postgres:esus@35.199.90.104:5433/farmacia"
engine = create_engine(DB_URL, connect_args={"connect_timeout": 60}, echo=True)

# Rota para obter as unidades válidas
@app.get("/unidades")
def get_unidades():
    # Seleciona as unidades da tabela local
    local_query = """
    SELECT nome
    FROM local
    WHERE nome NOT IN ('UPA Central', 'UPA Norte', 'Orbita', 'Unidade Condor2 22', 'Unidade teste 01', 'Unidade teste 02')
    """
    df_local = pd.read_sql(local_query, engine)
    unidades_validas = df_local['nome'].tolist()

    return {"unidades": unidades_validas}

@app.get("/estoque/{unidade}")
def get_estoque(unidade: str, page: int = 1, page_size: int = 5000):
    try:
        # Seleciona as unidades válidas da tabela local
        local_query = """
        SELECT nome
        FROM local
        WHERE nome NOT IN ('UPA Central', 'UPA Norte', 'Orbita', 'Unidade Condor2 22', 'Unidade teste 01', 'Unidade teste 02, CAF')
        """
        df_local = pd.read_sql(local_query, engine)
        unidades_validas = df_local['nome'].tolist()

        # Verifica se a unidade recebida é válida
        if unidade not in unidades_validas:
            raise HTTPException(status_code=400, detail="Unidade inválida ou não encontrada")

        # Realiza o SELECT na tabela de estoque para a unidade válida
        offset = (page - 1) * page_size
        query = """
        SELECT id, nome_medicamento, saldo_estoque, unidade, lote, data_movimentacao
        FROM vi_extrato_estoque 
        WHERE unidade = %s
        LIMIT %s OFFSET %s
        """
        
        # Passando os parâmetros corretamente como tupla
        params = (unidade, page_size, offset)
        df_estoque = pd.read_sql(query, engine, params=params)

        # Verifica se retornou dados
        if df_estoque.empty:
            raise HTTPException(status_code=404, detail="Nenhum item encontrado para esta unidade.")
        
        df_estoque['data_movimentacao'] = df_estoque['data_movimentacao'].apply(
            lambda x: x.replace(tzinfo=None).strftime("%d/%m/%Y %H:%M:%S") if isinstance(x, datetime) else x
        )

        df_estoque['saldo_estoque'] = df_estoque['saldo_estoque'].apply(lambda x: max(x, 0))

        return df_estoque.to_dict(orient="records")

    except Exception as e:
        # Captura qualquer erro e retorna uma mensagem personalizada
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estoque: {str(e)}")
    
@app.get("/estoque/CAF")
def get_estoque_caf(page: int = 1, page_size: int = 5000):
    try:
        unidade = 'CAF'  # A unidade agora é fixa como 'CAF'

        # Seleciona as unidades válidas da tabela local
        local_query = """
        SELECT nome
        FROM local
        WHERE nome NOT IN ('UPA Central', 'UPA Norte', 'Orbita', 'Unidade Condor2 22', 'Unidade teste 01', 'Unidade teste 02')
        """
        df_local = pd.read_sql(local_query, engine)
        unidades_validas = df_local['nome'].tolist()

        # Verifica se a unidade "CAF" existe nas unidades válidas
        if unidade not in unidades_validas:
            raise HTTPException(status_code=400, detail="Unidade 'CAF' não encontrada")

        # Realiza o SELECT para "CAF"
        offset = (page - 1) * page_size
        query = """
        SELECT id, nome_medicamento, saldo_estoque, unidade, lote, data_movimentacao
        FROM vi_extrato_estoque 
        WHERE unidade = 'CAF'
        LIMIT %s OFFSET %s
        """
        
        # Passando os parâmetros corretamente como tupla
        params = (unidade, page_size, offset)
        df_estoque = pd.read_sql(query, engine, params=params)

        # Verifica se retornou dados
        if df_estoque.empty:
            raise HTTPException(status_code=404, detail="Nenhum item encontrado para a unidade CAF.")
        
        # Converte data e saldo de estoque
        df_estoque['data_movimentacao'] = df_estoque['data_movimentacao'].apply(
            lambda x: x.replace(tzinfo=None).strftime("%d/%m/%Y %H:%M:%S") if isinstance(x, datetime) else None
        )

        df_estoque['saldo_estoque'] = df_estoque['saldo_estoque'].apply(lambda x: max(x, 0))

        return df_estoque.to_dict(orient="records")

    except Exception as e:
        # Captura o erro e imprime a mensagem de erro
        print(f"Erro: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estoque da CAF: {str(e)}")


# Rota para somar o saldo de estoque de cada unidade
@app.get("/saldo_total")
def get_saldo_total():
    try:
        # Query para somar o saldo de estoque por unidade
        query = """
        SELECT unidade, SUM(saldo_estoque) as total_saldo_estoque
        FROM vi_extrato_estoque
        GROUP BY unidade
        """ 

        df_saldo_total = pd.read_sql(query, engine)

        if df_saldo_total.empty:
            raise HTTPException(status_code=404, detail="Nenhum saldo de estoque encontrado.")

        return df_saldo_total.to_dict(orient="records")

    except Exception as e:
        # Captura qualquer erro e retorna uma mensagem personalizada
        raise HTTPException(status_code=500, detail=f"Erro ao somar saldo de estoque: {str(e)}")