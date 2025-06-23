import { supabase } from "~/server/supabaseConnection";

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event);
  const body = await readBody(event);
  const budgetId = Number(body.budgetId);

  if (!budgetId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Budget ID is required",
    });
  }

  // First, unselect all budgets for this user
  const { error: unselectError } = await supabase
    .from('budgets')
    .update({ selected: false })
    .eq('user_id', user.user.id);

  if (unselectError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error unselecting budgets: ${unselectError.message}`,
    });
  }

  // Then, select the specified budget
  const { data: selectedBudget, error: selectError } = await supabase
    .from('budgets')
    .update({ selected: true })
    .eq('id', budgetId)
    .eq('user_id', user.user.id)
    .select()
    .single();

  if (selectError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error selecting budget: ${selectError.message}`,
    });
  }

  if (!selectedBudget) {
    throw createError({
      statusCode: 404,
      statusMessage: "Budget not found or you don't have permission to select it",
    });
  }

  return { success: true, budget: selectedBudget };
}); 