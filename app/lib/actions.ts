'use server'

// * ↑ Marcar que todas las funciones que se exportan en este archivo son del servidor, por lo tanto no se pueden llamar o ejecutar desde el cliente

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid', 'pending']),
    date: z.string()
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    // console.log('createInvoice', formData);

    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // * Lo transformamos para evitar errores de redondeo
    const amountInCents = amount * 100;

    // * Creamos la fecha YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0];

    // * Console log para ver que todo está bien
    console.log({ customerId, amountInCents, status, date });

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    // * No se mostrara en la tabla del cliente por que los datos estan cacheados, por lo que debemos revalidar el path

    revalidatePath('/dashboard/invoices');

    // * Redireccionamos al cliente a la pagina de facturas

    redirect('/dashboard/invoices');

    // const rawFormData = Object.fromEntries(formData.entries());
    // console.log(rawFormData);
}