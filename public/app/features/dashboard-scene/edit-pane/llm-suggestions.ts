import { llms } from '@grafana/experimental';

const OPENAI_MODEL_NAME = 'gpt-3.5-turbo-1106';

const SUPPORTED_DATA_SOURCES = [
  'AWS IoT SiteWise',
  'Adobe Analytics',
  'Aggregations.io',
  'Akvorado',
  'Alertmanager',
  'Altinity plugin for ClickHouse',
  'Amazon Athena',
  'Amazon Aurora',
  'Amazon Managed Service for Prometheus',
  'Amazon Redshift',
  'Amazon Redshift',
  'Amazon Timestream',
  'Anodot Datasource',
  'Apache Cassandra',
  'Apache IoTDB',
  'AppDynamics',
  'AstraDB',
  'Atlassian Statuspage',
  'Axiom',
  'Azure Cosmos DB',
  'Azure Data Explorer Datasource',
  'Azure Devops',
  'Azure Monitor',
  'Business Input',
  'Business News',
  'Business Satellite',
  'CSV',
  'Catchpoint',
  'Chaos Mesh',
  'Checkmk data source for Checkmk Cloud & MSP',
  'ClickHouse',
  'CloudWatch',
  'CloudWatch Alarm',
  'Cloudflare',
  'CnosDB',
  'CockroachDB',
  'Cognite Data Fusion',
  'CompareQueries',
  'Crate',
  'Crate',
  'Cribl Search',
  'Databricks',
  'Datadog',
  'Datadog',
  'Destiny Datasource',
  'DeviceHive',
  'Discourse Datasource',
  'Drone',
  'Druid',
  'DynamoDB',
  'Dynatrace',
  'Elasticsearch',
  'FROST SensorThings API Plugin',
  'Factry Historian Datasource',
  'Falcon LogScale',
  'Finnhub',
  'Firestore',
  'FlightSQL',
  'Flowhook Webhooks Datasource',
  'GCP Status',
  'GitHub',
  'GitLab',
  'Google Analytics',
  'Google Big Query',
  'Google BigQuery',
  'Google Cloud Logging',
  'Google Cloud Monitoring',
  'Google Cloud Trace',
  'Google Sheets',
  'Google Sheets',
  'GoogleCalendar',
  'GoogleStackdriver',
  'Grafana',
  'Grafana Pyroscope',
  'Grafana Work Stats',
  'GraphQL Data Source',
  'Graphite',
  'Groonga',
  'HP Vertica',
  'Haystack',
  'Heroic',
  'Hetzner Cloud',
  'Highlight.io',
  'Honeycomb',
  'Hubble',
  'IBM Security QRadar',
  'IBM Security QRadar Suite',
  'ITRS Group Hub',
  'ITRS Group Obcerv',
  'Infinity',
  'InfluxDB',
  'Instana',
  'JSON',
  'JSON API',
  'JSON Fetcher',
  'Jaeger',
  'Jira',
  'Jira',
  'Kafka',
  'Logz.io',
  'Loki',
  'Looker',
  'MQTT',
  'Materialize',
  'MaxCompute',
  'Microsoft Azure',
  'Microsoft SQL Server',
  'Mixed datasource',
  'Mock',
  'MonetDB',
  'MongoDB',
  'Moogsoft',
  'Moogsoft AIOps',
  'MySQL',
  'Neo4j Datasource',
  'NetXMS',
  'Netlify',
  'New Relic',
  'New Relic',
  'Node Graph API',
  'OData',
  'OSIsoft-PI',
  'Open Automation Software (OAS)',
  'OpenSearch',
  'OpenTSDB',
  'Optimiz-SevOne Plugin',
  'Oracle',
  'Oracle Cloud Infrastructure Logs',
  'Oracle Cloud Infrastructure Metrics',
  'Oracle Database',
  'Orbit',
  'PNP',
  'PagerDuty',
  'Parseable',
  'Pixie Grafana Datasource Plugin',
  'PostgreSQL',
  'Prometheus',
  'Prometheus AlertManager Datasource',
  'Propel',
  'QuestDB',
  'Quickwit',
  'Rabbitmq',
  'Redis',
  'Riemann streams',
  'RunReveal',
  'SAP HANA®',
  'SPARQL',
  'SQLite',
  'Salesforce',
  'Scanner',
  'Sentry',
  'ServiceNow',
  'ServiceNow Cloud Observability',
  'Shoreline',
  'SignalFX',
  'SkyWalking',
  'Snowflake',
  'Splunk',
  'Splunk',
  'Splunk Infrastructure Monitoring',
  'Sqlyze Datasource',
  'Strava',
  'Streamr',
  'Sumo Logic',
  'SumoLogic',
  'Sun and Moon',
  'SurrealDB',
  'SurrealDB',
  'TDengine Datasource',
  'Tempo',
  'TestData',
  'Thruk',
  'Tokio Console',
  'Treasure Data',
  'Trino',
  'Vertica',
  'Vertica',
  'Wavefront',
  'Wavefront',
  'WebSocket API',
  'Wild GraphQL Data Source',
  'X-Ray',
  'YDB',
  'Yugabyte',
  'Zendesk',
  'Zendesk Datasource Plugin',
  'Zipkin',
  'grafana-jira-datasource',
  'hackerone-datasource',
  'kdb+',
  'netdata',
  'openGemini',
  'openHistorian',
  'simple grpc datasource',
];

interface LLMDataSourceGuess {
  datasource: string;
  probability: number;
  explanation: string;
}

export async function getLLMSuggestions(query: string): Promise<LLMDataSourceGuess[]> {
  let suggestions: LLMDataSourceGuess[] = [];

  try {
    const enabled = await llms.openai.enabled();

    if (!enabled) {
      return [];
    }
    if (query === '') {
      return [];
    }

    const completion = await llms.openai.chatCompletions({
      model: OPENAI_MODEL_NAME,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
    });

    suggestions = JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error fetching LLM suggestions:', error);
  } finally {
    console.log('LLM suggestions:', suggestions);
    return suggestions;
  }
}

const SYSTEM_PROMPT = `
  The following is a list of Grafana data sources.
  Each of these data sources allows users in Grafana to query data from that location by hitting its APIs,
  often using its own query language:

  ${SUPPORTED_DATA_SOURCES.join('\n')}

  I need you to interpret data that the user pastes in,
  and give your top 3 guesses as to what the data the user is inputting is trying to query.

  The guesses should be presented as an array of object, each object containing the following fields:
  - datasource: the name of the data source from the list above
  - probability: a number between 0 and 1 representing the likelihood that the user is querying that data source
  - explanation: a string no longer than 100 characters explaining why you think the user is querying that data source
  The user might paste in a direct query, or a URL that pertains to that data source, or some other free-text information.
  The output should only contain the JSON with no extra formatting so that it can be easily parsed in JavaScript with JSON.parse().
`;
