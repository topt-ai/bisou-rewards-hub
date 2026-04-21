CREATE POLICY "Users can insert own welcome transaction"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND tipo = 'bienvenida'
  AND puntos = 10
);

CREATE POLICY "Users can update own profile points on welcome"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);