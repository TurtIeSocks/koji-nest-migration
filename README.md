# koji-nest-migration
 
## Min Requirements
- Node 18
- NPM 8

## Config
- `NEST_HOST` - Nest table host (string)
- `NEST_PORT` - Nest table port (number)
- `NEST_USER` - Nest table user (string)
- `NEST_PASSWORD` - Nest table password (string)
- `NEST_DATABASE` - Nest table database (string)
- `KOJI_URL` - Koji API URL (string)
- `KOJI_SECRET` - Koji secret (string)
- `MIN_AREA` - Minimum nest area to filter by (meters squared) (number)
- `COMBINE` - Combine all nests into a single MultiPolygon (boolean)

## Usage
- `npm install`
- `cp .env.example .env`
- `nano .env`
- `npm start`
