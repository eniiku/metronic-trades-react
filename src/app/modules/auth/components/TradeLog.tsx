import { useQuery } from 'react-query'
import { fetchUserTradeSummary } from '../../../../services/api'
import { TradeWidget } from '../../../../_metronic/partials/widgets/custom/TradeWidget'

const TradeLog = () => {
  const {
    data: trades,
    isLoading,
    isError,
  } = useQuery('trades', fetchUserTradeSummary)

  console.log(trades)
  return (
    <div>
      <div className='row gy-5 g-xl-8 mb-5 mb-xl-10'>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          trades.data.summary_data.map((trade: any, index: number) => (
            <div>
              <TradeWidget
                key={trade._id ? trade._id : index}
                data={trade}
                className='card-xl-stretch mb-xl-8 justify-content-between gap-xl-5 flex-xl-row align-items-xl-center'
              />
            </div>
          ))
        )}

        {isError ? <div>Error Loading Trades</div> : null}
      </div>
      {/* custom end::Row */}
    </div>
  )
}

export default TradeLog
