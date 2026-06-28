import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { envio_id } = await req.json()
    if (!envio_id) {
      return new Response(JSON.stringify({ error: 'envio_id es obligatorio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: envio, error: envioError } = await supabase
      .from('envios')
      .select(
        'codigo, creado_en, centro_origen:centros!envios_centro_origen_id_fkey(nombre), centro_destino:centros!envios_centro_destino_id_fkey(nombre), responsable:usuarios(nombre)'
      )
      .eq('id', envio_id)
      .single()

    if (envioError || !envio) {
      return new Response(JSON.stringify({ error: envioError?.message ?? 'Envio no encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: items, error: itemsError } = await supabase
      .from('movimientos_inventario')
      .select('cantidad, items_inventario(nombre, unidad)')
      .eq('envio_id', envio_id)

    if (itemsError) {
      return new Response(JSON.stringify({ error: itemsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const lineasItems = (items ?? [])
      .map((m) => `- ${m.items_inventario?.nombre}: ${m.cantidad} ${m.items_inventario?.unidad ?? ''}`)
      .join('\n')

    const fecha = new Date(envio.creado_en).toLocaleString('es-VE')

    const texto = [
      `*ACTA DE ENVIO — HumaVE*`,
      `Codigo: ${envio.codigo}`,
      `Origen: ${envio.centro_origen?.nombre ?? '—'}`,
      `Destino: ${envio.centro_destino?.nombre ?? '—'}`,
      `Responsable: ${envio.responsable?.nombre ?? '—'}`,
      `Fecha: ${fecha}`,
      ``,
      `Items:`,
      lineasItems || '(sin items)',
    ].join('\n')

    return new Response(JSON.stringify({ texto }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
