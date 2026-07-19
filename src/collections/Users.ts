import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Uživatel', plural: 'Uživatelé' },
  admin: {
    useAsTitle: 'email',
    group: 'Systém',
  },
  auth: true,
  fields: [
    // E-mail přidává auth automaticky; role přijdou s fází 4 (chataři, komunita)
  ],
}
