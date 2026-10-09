#!/bin/sh
# Rotina diária do contêiner "backup":
#  1. cópia completa do banco (pg_dump, formato custom) em /backups, mantida por BACKUP_RETENTION_DAYS dias;
#  2. limpeza dos dados técnicos de segurança vencidos (limites de requisição, tokens, sessões);
#  3. exclusão das participações quando a data PARTICIPACOES_EXCLUIR_APOS (AAAA-MM-DD) passar.
set -eu
umask 077

while true; do
  arquivo="/backups/decida-voto-$(date +%Y-%m-%d).dump"
  if pg_dump -Fc -f "$arquivo.tmp"; then
    mv "$arquivo.tmp" "$arquivo"
    echo "$(date -Iseconds) backup concluído: $arquivo"
  else
    rm -f "$arquivo.tmp"
    echo "$(date -Iseconds) ERRO: falha no backup" >&2
  fi
  find /backups -name 'decida-voto-*.dump' -mtime +"${BACKUP_RETENTION_DAYS:-14}" -delete

  psql -v ON_ERROR_STOP=1 -q -c "
    delete from limites_requisicao where janela_inicio < now() - interval '48 hours';
    delete from tokens_usados where expira_em < now();
    delete from admin_sessoes where expira_em < now() or ultimo_acesso < now() - interval '30 minutes';
  " && echo "$(date -Iseconds) dados técnicos vencidos removidos"

  if [ -n "${PARTICIPACOES_EXCLUIR_APOS:-}" ]; then
    hoje=$(date +%Y%m%d)
    limite=$(echo "$PARTICIPACOES_EXCLUIR_APOS" | tr -d '-')
    if [ "$hoje" -gt "$limite" ]; then
      psql -v ON_ERROR_STOP=1 -q -c "delete from participacoes;" && echo "$(date -Iseconds) prazo de retenção encerrado: participações excluídas"
    fi
  fi

  sleep 86400
done
