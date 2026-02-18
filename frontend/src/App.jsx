import Workspace from './Workspace'
import { EthereaProvider } from './context/EthereaContext'

export default function App() {
  return (
    <EthereaProvider>
      <Workspace />
    </EthereaProvider>
  )
}
