import { supabase } from "~/server/supabaseConnection";

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event);

  const { data: budget, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('selected', true)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    throw createError({
      statusCode: 500,
      statusMessage: `Error fetching selected budget: ${error.message}`,
    });
  }

  return budget || null;
}); 