import { GoogleGenAI } from "@google/genai";
import { Transaction, InventoryItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBusinessHealth = async (
  transactions: Transaction[],
  inventory: InventoryItem[]
): Promise<string> => {
  try {
    const financialSummary = transactions.reduce((acc, t) => {
      if (t.type === 'SALE') acc.sales += t.totalAmount;
      if (t.type === 'SERVICE') acc.services += t.totalAmount;
      if (t.type === 'EXPENSE') acc.expenses += Math.abs(t.totalAmount);
      if (t.totalProfit) acc.totalProfit += t.totalProfit;
      return acc;
    }, { sales: 0, services: 0, expenses: 0, totalProfit: 0 });

    const lowStockItems = inventory.filter(i => i.quantity <= (i.minStockLevel || 0)).map(i => i.name).join(', ');
    const stockValue = inventory.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);

    const prompt = `
      Atue como um consultor financeiro sênior para uma loja de iPhones.
      Analise os seguintes dados e me dê um resumo executivo de 3 pontos (pontos fortes, pontos de atenção, sugestão de ação).
      
      Dados Financeiros (Últimos dias):
      - Vendas de Produtos: R$ ${financialSummary.sales}
      - Serviços prestados: R$ ${financialSummary.services}
      - Despesas Operacionais: R$ ${financialSummary.expenses}
      - Lucro Bruto Estimado: R$ ${financialSummary.totalProfit}
      
      Dados de Estoque:
      - Valor total em estoque (custo): R$ ${stockValue}
      - Itens com estoque crítico: ${lowStockItems || 'Nenhum'}
      
      Responda em português, com formatação clara e tom profissional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Erro ao conectar com a inteligência artificial. Verifique sua chave de API.";
  }
};