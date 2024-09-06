import type { NextPage } from 'next';

import { api } from '~/utils/api';

const AnalyticsPage: NextPage = () => {
  const { data } = api.snake.analytics.useQuery();
  
  return (
    <div>
      <h1>Analytics</h1>
      {data ? (
        <>
          <p>Total Snake Games: {data.totalGames.toLocaleString()}</p>
          <p>Unique Users Who Created Games: {data.uniqueUsersWhoCreatedGames.toLocaleString()}</p>
          <p>Players with Address: {data.playersWithAddress.toLocaleString()}</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default AnalyticsPage;