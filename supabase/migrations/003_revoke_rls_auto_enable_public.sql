-- `rls_auto_enable()` ya existia en el proyecto Supabase antes de estas
-- migraciones: es un event trigger SECURITY DEFINER que activa RLS
-- automaticamente en cualquier tabla nueva del schema public (red de
-- seguridad util, se deja intacta). El problema era que quedaba expuesta
-- como RPC publica (/rest/v1/rpc/rls_auto_enable) por el GRANT por defecto
-- a PUBLIC en Postgres. Revocar solo de anon/authenticated no alcanza --
-- hay que revocar de PUBLIC explicitamente, ya que todos los roles heredan
-- de PUBLIC.

revoke execute on function public.rls_auto_enable() from public;
