"use client";

import {
  CustomerForm,
  type SavedCustomer as CreatedCustomer,
} from "@/components/customer/customer-form";

type CustomerCreateFormProps = {
  onSuccess?: (customer: CreatedCustomer) => void;
  onCancel?: () => void;
  refreshOnSuccess?: boolean;
  submitLabel?: string;
  className?: string;
};

/**
 * Wrapper de compatibilidade para os fluxos que ainda importam CustomerCreateForm.
 * Mantém o modo compacto (nome + telefone) usado no cadastro rápido.
 */
export function CustomerCreateForm(props: CustomerCreateFormProps) {
  return <CustomerForm mode="compact" {...props} />;
}

export type { CreatedCustomer };
