import GameTable from './components/GameTable';
import { mockState, MOCK_MY_ID } from './components/GameTable/mockState';

export default function App() {
  return <GameTable state={mockState} myId={MOCK_MY_ID} />;
}
