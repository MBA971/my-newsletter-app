# Frontend Structure

## Components Organization

```
src/
├── components/
│   ├── auth/           # Authentication components (Login, Register)
│   ├── ui/             # Reusable UI components (Buttons, Cards, Modals)
│   └── views/          # Page-level components
│       ├── admin/      # Admin dashboard and management views
│       ├── contributor/ # Contributor-specific views
│       └── public/     # Public-facing views
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── App.jsx             # Main application component
├── App.css             # Global styles
└── main.jsx            # Application entry point
```

## Views Structure

- **Public Views**: Accessible to all users (news browsing, search)
- **Contributor Views**: For content creators (article management)
- **Admin Views**: For administrators (user management, domain management)

## Styling

Global styles are in `App.css`. Component-specific styles should be kept minimal and use CSS classes defined in the global stylesheet when possible.

## Routing

Routing is handled in `App.jsx` with conditional rendering based on user roles:
- Public users see public views
- Contributors see public and contributor views
- Admins see all views