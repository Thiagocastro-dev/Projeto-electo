# Estágio 1: Construção (Build) com Node.js
FROM node:20-alpine AS builder

# Define a pasta de trabalho dentro do contentor
WORKDIR /app

# Copia os ficheiros de dependências primeiro (para otimizar a cache do Docker)
COPY package.json package-lock.json* ./

# Instala as dependências
RUN npm install

# Copia todo o resto do código fonte para dentro do contentor
COPY . .

# Aceita as variáveis de ambiente durante a construção
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Compila a aplicação Vite (gera a pasta 'dist')
RUN npm run build

# Estágio 2: Servidor Web Leve (Nginx)
FROM nginx:alpine

# Copia a pasta 'dist' gerada no passo anterior para a pasta pública do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia o nosso ficheiro de configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 internamente
EXPOSE 80

# Inicia o servidor Nginx
CMD ["nginx", "-g", "daemon off;"]