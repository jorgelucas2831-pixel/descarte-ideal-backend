-- Permite armazenar custos de fretes terceirizados em app_records,
-- preservando integralmente os tipos já autorizados pela constraint atual.
DO $$
DECLARE
  current_definition text;
  current_expression text;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
    INTO current_definition
  FROM pg_constraint c
  WHERE c.conrelid = 'public.app_records'::regclass
    AND c.conname = 'app_records_record_type_check'
    AND c.contype = 'c';

  IF current_definition IS NULL THEN
    RAISE EXCEPTION 'A constraint app_records_record_type_check não foi encontrada em public.app_records.';
  END IF;

  -- Remove apenas o invólucro CHECK (...), mantendo a expressão original.
  current_expression := substring(
    current_definition
    FROM 8
    FOR char_length(current_definition) - 8
  );

  EXECUTE 'ALTER TABLE public.app_records DROP CONSTRAINT app_records_record_type_check';

  EXECUTE format(
    'ALTER TABLE public.app_records ADD CONSTRAINT app_records_record_type_check CHECK ((%s) OR (record_type = %L))',
    current_expression,
    'fleet_freights'
  );
END
$$;
