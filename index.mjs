import fs from 'fs'
import knex from 'knex'
import calcArea from '@turf/area'
import env from 'dotenv'
import combine from '@turf/combine'

env.config()

const connection = knex({
  client: 'mysql2',
  connection: {
    host: process.env.NEST_HOST,
    port: process.env.NEST_PORT,
    database: process.env.NEST_DATABASE,
    user: process.env.NEST_USER,
    password: process.env.NEST_PASSWORD,
  },
})

const minArea = process.env.MIN_AREA ? +process.env.MIN_AREA : 0

const hasPolygon = await connection('nests')
  .columnInfo()
  .then((columns) => 'polygon' in columns)

const results = hasPolygon
  ? await connection('nests').select(
      '*',
      connection.raw('ST_AsGeoJSON(polygon) AS polygon')
    )
  : await connection('nests').select('*')

connection.destroy()

const fc = {
  type: 'FeatureCollection',
  features: results
    .filter((result) => result.polygon_path || result.polygon)
    .map((result) => {
      const { polygon, polygon_path, ...nest } = result
      const feature = {
        geometry:
          hasPolygon && polygon
            ? typeof polygon === 'string'
              ? JSON.parse(polygon)
              : polygon
            : {
                type: 'Polygon',
                coordinates: JSON.parse(polygon_path).map((line) =>
                  line.map((point) => [point[1], point[0]])
                ),
              },
        properties: {
          ...nest,
          __name: nest.name,
        },
      }
      feature.properties.area = calcArea(feature.geometry)
      return feature
    })
    .filter((feature) => feature.properties.area > minArea),
}

const featureCollection = process.env.COMBINE === 'true' ? combine(fc) : fc

if (process.env.COMBINE === 'true') {
  featureCollection.features[0].properties.name = 'Nests'
  featureCollection.features[0].properties.collectedProperties = undefined
}

if (process.env.KOJI_URL && process.env.KOJI_SECRET) {
  const response = await fetch(process.env.KOJI_URL + '/api/v1/geofence/save-koji', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.KOJI_SECRET}`,
    },
    body: JSON.stringify({ area: featureCollection }),
  })
  if (!response.ok) {
    console.error('Unable to save to koji', await response.text())
  } else {
    console.log('Saved to koji', await response.json())
  }
} else {
  fs.writeFileSync('nests.json', JSON.stringify(featureCollection))
  console.log(
    'Created `nests.json` with',
    featureCollection.features.length,
    'features'
  )
}
