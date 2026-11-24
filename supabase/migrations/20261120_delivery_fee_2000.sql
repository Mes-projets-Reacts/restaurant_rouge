create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_mode text,
  p_delivery_address text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_items jsonb;
  v_item_count integer;
  v_subtotal bigint;
  v_delivery_fee integer;
begin
  if length(trim(coalesce(p_customer_name, ''))) not between 1 and 120 then
    raise exception 'Nom invalide';
  end if;

  if coalesce(p_customer_phone, '') !~ '^(70|76|77|78|75|72|74)[0-9]{7}$' then
    raise exception 'Numéro de téléphone invalide';
  end if;

  if p_delivery_mode is null
     or p_delivery_mode not in ('takeaway', 'on_site', 'delivery') then
    raise exception 'Mode de réception invalide';
  end if;

  if p_delivery_mode = 'delivery'
     and length(trim(coalesce(p_delivery_address, ''))) not between 1 and 500 then
    raise exception 'Adresse de livraison invalide';
  end if;

  if p_delivery_mode <> 'delivery' and p_delivery_address is not null then
    raise exception 'Adresse inattendue pour ce mode de réception';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'La commande doit contenir une liste de plats';
  end if;

  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'La commande doit contenir entre 1 et 50 plats';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as entry(item)
    where coalesce(jsonb_typeof(entry.item->'id'), 'null') <> 'string'
       or (entry.item->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(jsonb_typeof(entry.item->'qty'), 'null') <> 'number'
       or (entry.item->>'qty') !~ '^[1-9][0-9]*$'
       or (entry.item->>'qty')::numeric > 99
  ) then
    raise exception 'Contenu de commande invalide';
  end if;

  if exists (
    select entry.item->>'id'
    from jsonb_array_elements(p_items) as entry(item)
    group by entry.item->>'id'
    having count(*) > 1
  ) then
    raise exception 'Un plat ne peut apparaître qu’une fois dans la commande';
  end if;

  select
    count(*)::integer,
    coalesce(sum(d.price::bigint * (entry.item->>'qty')::integer), 0),
    jsonb_agg(jsonb_build_object(
      'id', d.id,
      'name', d.name,
      'qty', (entry.item->>'qty')::integer,
      'price', d.price
    ) order by d.name)
  into v_item_count, v_subtotal, v_items
  from jsonb_array_elements(p_items) as entry(item)
  join public.dishes d
    on d.id = (entry.item->>'id')::uuid
   and d.is_available = true;

  if v_item_count <> jsonb_array_length(p_items) then
    raise exception 'Un ou plusieurs plats ne sont plus disponibles';
  end if;

  v_delivery_fee := case when p_delivery_mode = 'delivery' then 2000 else 0 end;

  if v_subtotal > 2147483647 - v_delivery_fee then
    raise exception 'Montant de commande trop élevé';
  end if;

  insert into public.orders (
    customer_name,
    customer_phone,
    delivery_mode,
    delivery_address,
    delivery_fee,
    items,
    subtotal,
    total,
    status
  )
  values (
    trim(p_customer_name),
    p_customer_phone,
    p_delivery_mode,
    case when p_delivery_mode = 'delivery' then trim(p_delivery_address) else null end,
    v_delivery_fee,
    v_items,
    v_subtotal::integer,
    (v_subtotal + v_delivery_fee)::integer,
    'new'
  )
  returning id into v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'items', v_items,
    'subtotal', v_subtotal::integer,
    'delivery_fee', v_delivery_fee,
    'total', (v_subtotal + v_delivery_fee)::integer
  );
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, jsonb) to anon, authenticated;
