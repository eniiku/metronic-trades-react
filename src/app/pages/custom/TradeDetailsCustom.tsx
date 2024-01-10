import { useParams } from 'react-router-dom'
import {
  fetchMarketPrice,
  fetchTradeSummaryDetails,
} from '../../../services/api'
import { useQuery } from 'react-query'
import {
  getAvgValue,
  getCallPut,
  getDaysOpen,
  getEntryPrice,
  getExpiryDate,
  getForexTicker,
  getStrikePrice,
} from '../../../lib/utils'
import { StatisticsWidgetCustom } from '../../../_metronic/partials/widgets/statistics/StatisticsWidgetCustom'
import { useEffect, useState } from 'react'
import { KTIcon } from '../../../_metronic/helpers'
import moment from 'moment'

export const TradeDetailsCustom = () => {
  // const { tradeId } = useParams()

  const tradeId = '657330f3428e3eb6f362cb01'

  const [underlyingPrice, setUnderlyingPrice] = useState(0)
  const [currentMarketPrice, setCurrentMarketPrice] = useState(0)

  const { data: tradeDetails } = useQuery('tradeDetails', () =>
    fetchTradeSummaryDetails(tradeId ? tradeId : '')
  )
  const tradeDetailsData = tradeDetails?.data[0]

  console.log('Trade Details', tradeDetails)

  let tickerSymbol: string

  if (tradeDetailsData?.equityType == 'Forex') {
    const ts = getForexTicker(tradeDetailsData?.ticker)
    tickerSymbol = ts.replace('/', '')
  } else if (tradeDetailsData?.equityType == 'Option') {
    tickerSymbol = tradeDetailsData?.ticker?.split('_')[0]
  } else tickerSymbol = tradeDetailsData?.ticker

  const { data: marketPrice } = useQuery('marketPrice', () =>
    fetchMarketPrice(tradeDetailsData?.equityType, tickerSymbol)
  )

  console.log('Market Price', marketPrice)

  const entryPrice = tradeDetailsData?.entryPrice

  const exitPrice = tradeDetailsData?.exitPrice

  const transactionType = tradeDetailsData?.transactionType

  const sentiment =
    tradeDetailsData?.tradeDirection == 'BTO' ? 'Bullish' : 'Bearish'

  const trade_data = tradeDetailsData?.tradeData

  const priceTarget =
    trade_data?.length > 0 && trade_data?.find((x: any) => x?.tp)?.tp
      ? '$' + trade_data?.find((x: any) => x?.tp)?.tp
      : 'N/A'
  const stopLoss =
    trade_data?.length > 0 && trade_data?.find((x: any) => x?.sl)?.sl
      ? '$' + trade_data.find((x: any) => x?.sl)?.sl
      : 'N/A'

  useEffect(() => {
    if (marketPrice) setCurrentMarketPrice(marketPrice?.data.regularMarketPrice)
    if (tradeDetailsData?.equityType == 'Option') {
      setUnderlyingPrice(
        marketPrice?.data.underlyingPrice
          ? marketPrice?.data.underlyingPrice?.toFixed(2)
          : 'N/A'
      )
    } else {
      if (tradeDetailsData?.isOpen)
        setUnderlyingPrice(marketPrice?.data.regularMarketPrice)
      else
        setUnderlyingPrice(
          tradeDetailsData?.exitPrice
            ? tradeDetailsData?.exitPrice?.toFixed(2)
            : 0
        )
    }
  }, [marketPrice])

  const iframeHtml = `
  <div class="tradingview-widget-container" style="padding: 0; margin: 0; background; height: 500px;">
    <div id="tradingview_${tickerSymbol}" style="height: 100%;"></div>
    <div class="tradingview-widget-copyright">
      <a href="https://www.tradingview.com/symbols/${tickerSymbol}/"></a>
    </div>
    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    <script type="text/javascript">
      new TradingView.widget({
        "autosize": true,
        "symbol": "${tickerSymbol}",
        "interval": "15",
        "timezone": "America/New_York",
        "theme": "dark",
        "isTransparent": false,
        "locale": "en",
        "toolbar_bg": "#aa0000",
        "withdateranges": false,
        "enable_publishing": false,
        "allow_symbol_change": false,
        "container_id": "tradingview_${tickerSymbol}"
      });
    </script>
  </div>
`

  return (
    <div className='w-lg-75 mx-auto'>
      <div className='row'>
        {[
          { title: 'Trade Entry', description: `$${entryPrice}` },
          {
            title: 'Trade Exit',
            description: `$${exitPrice ? exitPrice?.toFixed(2) : 'N/A'}`,
          },
          {
            title: 'Current Price',
            description: `${
              currentMarketPrice
                ? tradeDetailsData?.equityType == 'Crypto'
                  ? '$' + currentMarketPrice?.toFixed(4)
                  : '$' + currentMarketPrice
                : 'N/A'
            }`,
          },
          {
            title: 'Underlying',
            description: `$${
              underlyingPrice
                ? tradeDetailsData?.equityType == 'Crypto'
                  ? underlyingPrice?.toFixed(4)
                  : underlyingPrice
                : 'N/A'
            }`,
          },
        ].map((trade) => (
          <div key={trade.title} className='col-6 col-md-3'>
            <StatisticsWidgetCustom
              className='card-xl-stretch mb-xl-8 text-center'
              color='light'
              title={trade.title}
              titleColor='text-gray-500'
              description={trade.description}
              descriptionColor='muted'
            />
          </div>
        ))}
      </div>

      <div className='separator my-6 border-gray-300'></div>

      <div className='row'>
        {[
          { title: 'Trade Type', description: transactionType },
          { title: 'Trade Direction', description: sentiment },
          { title: 'Price Target', description: priceTarget },
          { title: 'Stop Loss', description: stopLoss },
        ].map((trade, index) => (
          <div key={trade.title} className='col-6 col-md-3'>
            <StatisticsWidgetCustom
              className='card-xl-stretch mb-xl-8 text-center'
              color={index >= 2 ? 'gray-300' : 'light'}
              title={trade.title}
              titleColor='text-gray-500'
              description={trade.description}
              descriptionColor='muted'
            />
          </div>
        ))}
      </div>

      <div className='separator my-6 border-gray-300'></div>

      <div className='timeline'>
        {trade_data?.map((item: any, index: number) => {
          const dateOne = moment(item.createdAt).format('DD-MM-YYYY')
          const dateTwo = trade_data[index - 1]?.createdAt
            ? moment(trade_data[index - 1]?.createdAt).format('DD-MM-YYYY')
            : moment().format('DD-MM-YYYY')
          const priceOne = item.price
          const priceTwo = trade_data[index - 1]?.price

          return (
            <div key={item?._id} className='timeline-item'>
              <div className='timeline-line w-40px'></div>

              <div className='timeline-icon symbol symbol-circle symbol-20px me-4'>
                <div className='symbol-label bg-light'>
                  <KTIcon iconName='chart' className='fs-2 text-info' />
                </div>
              </div>

              <div className='timeline-content mb-10 mt-n1'>
                <div className='pe-3 mb-5'>
                  <div className='fs-3 fw-semibold text-muted mb-2 fst-italic'>
                    {dateOne !== dateTwo
                      ? `${moment(item.createdAt).format(
                          'MMMM DD, YYYY'
                        )} | ${moment(item.createdAt).format(
                          'hh:MM:SS A'
                        )} (${moment(item.createdAt).fromNow()})`
                      : index !== 0
                      ? `${moment(item.createdAt).format(
                          'hh:MM:SS A'
                        )} (${moment(item.createdAt).fromNow()})`
                      : `${moment(item.createdAt).format(
                          'MMMM DD, YYYY'
                        )} | ${moment(item.createdAt).format(
                          'hh:MM:SS A'
                        )} (${moment(item.createdAt).fromNow()})`}
                  </div>

                  <div className='d-flex align-items-center mt-4 fs-6 gap-6'>
                    {tradeDetailsData.equityType === 'Stock' ||
                    tradeDetailsData.equityType === 'Crypto' ||
                    tradeDetailsData.equityType === 'Forex' ? (
                      <div className='d-flex align-items-center flex-wrap gap-6'>
                        <div
                          className={`btn btn-solid w-125px py-2 ${
                            item?.transactionType === 'Debit'
                              ? 'bg-success'
                              : 'bg-danger'
                          }`}
                        >
                          {item?.tradeDirection == 'STO'
                            ? 'SHORT'
                            : item.transactionType === 'Debit'
                            ? 'BOUGHT'
                            : 'SOLD'}
                        </div>
                        {tradeDetailsData?.isOpen ? (
                          <>
                            <div className='text-muted me-4 fs-7'>
                              @{' '}
                              <span className='ms-2 bg-gray-400 text-dark rounded py-2 px-4 fw-medium'>
                                {`$${item?.price ? item?.price : entryPrice}`}
                              </span>
                            </div>

                            {priceOne !== priceTwo &&
                              priceTwo !== undefined && (
                                <div className='text-muted me-4 fs-7'>
                                  Avg:{' '}
                                  <span className='ms-2 bg-gray-400 text-dark rounded py-2 px-4 fw-medium'>
                                    {`$${getAvgValue([priceOne, priceTwo])}`}
                                  </span>
                                </div>
                              )}
                          </>
                        ) : (
                          <div className='text-muted me-4 fs-7'>
                            @{' '}
                            <span className='ms-2 bg-gray-400 text-dark rounded py-2 px-4 fw-medium'>
                              {`$${
                                item?.price
                                  ? item?.price
                                  : getEntryPrice(tradeDetailsData)
                              }`}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='d-flex align-items-center flex-wrap gap-6'>
                        <div
                          className={`btn btn-solid w-125px py-2 ${
                            item?.transactionType === 'Debit'
                              ? 'bg-success'
                              : 'bg-danger'
                          }`}
                        >
                          {item?.tradeDirection == 'STO'
                            ? 'SHORT'
                            : item.transactionType === 'Debit'
                            ? 'BOUGHT'
                            : 'SOLD'}
                        </div>

                        <div className='text-muted me-4 fs-7'>
                          <span className='ms-2 bg-gray-400 text-dark rounded py-2 px-4 fw-medium'>
                            {getExpiryDate(tradeDetailsData)}
                          </span>

                          <span className='ms-2 bg-dark text-gray-400 rounded py-2 px-4 fw-medium'>
                            {`${getDaysOpen(tradeDetailsData)}D`}
                          </span>
                        </div>

                        <div className='text-muted me-4 fs-7'>
                          <span className='ms-2 bg-gray-400 text-dark rounded py-2 px-4 fw-medium'>
                            {`$${getStrikePrice(tradeDetailsData)}`}
                          </span>

                          <span className='ms-2 bg-dark text-gray-400 rounded py-2 px-4 fw-medium'>
                            {getCallPut(tradeDetailsData)}
                          </span>
                        </div>

                        <div className='text-muted me-4 fs-7'>
                          @{' '}
                          <span className='ms-2 bg-gray-400 text-dark rounded py-2 px-4 fw-medium'>
                            {`$${
                              item?.price
                                ? item?.price
                                : getEntryPrice(tradeDetailsData)
                            }`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {tradeDetails ? (
        <div>
          <iframe
            title={`TradingView Chart - ${tickerSymbol}`}
            srcDoc={iframeHtml}
            width='100%'
            height={520}
            frameBorder='0'
            style={{ backgroundColor: 'transparent', marginTop: 12 }}
          />
        </div>
      ) : null}
    </div>
  )
}
