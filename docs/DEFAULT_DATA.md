# Default Data Creation

## Automatic User Setup

When a new user signs up, the following happens automatically:

### 1. User Profile Creation

- Trigger: `on_auth_user_created`
- Creates entry in `user_profiles` table
- Extracts first_name and last_name from signup metadata
- Runs immediately after auth.users INSERT

### 2. Default Categories Creation

- Trigger: `create_user_default_categories`
- Creates 3 default categories:

| Name     | Icon      | Color                  | Position |
| -------- | --------- | ---------------------- | -------- |
| Work     | Briefcase | #B0E0E6 (Pastel Blue)  | a0       |
| Personal | Home      | #C8E6C9 (Pastel Green) | a1       |
| Health   | Heart     | #FFB6C1 (Pastel Rose)  | a2       |

- Runs after user_profile INSERT
- Uses lexorank positioning for ordering

## Security

- Both functions use `SECURITY DEFINER` to bypass RLS
- This is safe because:
  - They only create data for the new user
  - They run in response to new user creation
  - They don't expose existing user data

## Testing

Default data creation is tested end-to-end in NOWLY-55 with real user signup flow.

## Customization

Users can:

- Delete default categories if not needed
- Edit default categories (name, color, emoji)
- Add additional categories
