import { llms } from '@grafana/experimental';
import { getDataSourceSrv } from '@grafana/runtime';

const OPENAI_MODEL_NAME = 'gpt-3.5-turbo-1106';
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
      messages: getMessages(query),
    });

    suggestions = JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error fetching LLM suggestions:', error);
  } finally {
    console.log('LLM suggestions:', suggestions);
    return suggestions;
  }
}

function getMessages(query: string): llms.openai.Message[] {
  const dataSourceList = getDataSourceSrv().getList();

  const systemPrompt = `
    The following is a list of data sources available to the user.
    Each of these data sources allows users in Grafana to query data from that location by hitting its APIs,
    often using its own query language:

    ${dataSourceList.map(({ name }) => name).join('\n')}

    I need you to interpret data that the user pastes in,
    and give your top 3 guesses as to what the data the user is inputting is trying to query. 

    The guesses should be presented as an array of object, each object containing the following fields:
    - datasource: the name of the data source from the list above
    - probability: a number between 0 and 1 representing the likelihood that the user is querying that data source
    - explanation: a string no longer than 100 characters explaining why you think the user is querying that data source

    The user might paste in one of the following:
    - a direct query
    - a URL that pertains to that data source

    Do not include data sources with a probability less than 0.2.
    The output should only contain the JSON with no extra formatting so that it can be easily parsed using JSON.parse().
`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query },
  ];
}
