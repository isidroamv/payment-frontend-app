import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import moment from 'moment';
import { useDebounce, useDebouncedCallback } from 'use-debounce';

import usdFlag from '../../assets/usd.svg';
import mxnFlag from '../../assets/mxn.svg';
import copFlag from '../../assets/cop.svg';
import logo from '../../assets/logo.gif';
import './Quotes.css';

const API_URL = process.env.REACT_APP_API_URL;

const currencyOptions = {
    base: [
        { value: 'USD', label: <div><img src={usdFlag} alt="USD" style={{ width: 20, marginRight: 10 }} /> Dolar Estadounidense</div> },
    ],
    quote: [
        { value: 'MXN', label: <div><img src={mxnFlag} alt="MXN" style={{ width: 20, marginRight: 10 }} /> Peso Mexicano</div> },
        { value: 'COP', label: <div><img src={copFlag} alt="COP" style={{ width: 20, marginRight: 10 }} /> Peso Colombiano</div> },
    ],
};

const Dropdown = ({ children, ...props }) => (
    <Select
        components={{
            IndicatorSeparator: () => null,
            ValueContainer: () => null,
            Input: () => null,
            Placeholder: () => null,
            DropdownIndicator: () => <div data-testid={props.dataTestIdDropdown}>{children}</div>,
        }}
        autoFocus={false}
        styles={{
            clearIndicator: (base) => ({ ...base, padding: 0 }),
            control: (base) => ({
                ...base,
                borderColor: 'transparent',
                '&:hover': { borderColor: 'transparent' },
            }),
            menu: (base) => ({ ...base, width: '300px' }),
        }}
        isSearchable
        {...props}
    />
);

const getCurrencyFlag = (currency) => {
    switch (currency) {
        case 'USD': return usdFlag;
        case 'MXN': return mxnFlag;
        case 'COP': return copFlag;
        default: return null;
    }
}

const ExpirationTimer = ({ expirationTimestamp }) => {
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = moment();
            const expiration = moment(expirationTimestamp);
            const duration = moment.duration(expiration.diff(now));

            if (duration.asSeconds() <= 0) {
                setTimeRemaining('Expirado');
                return;
            }

            const minutes = Math.floor(duration.asMinutes());
            const seconds = Math.floor(duration.asSeconds() % 60);
            setTimeRemaining(`Válido por ${minutes} minutos y ${seconds} segundos`);
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        return () => clearInterval(intervalId);
    }, [expirationTimestamp]);

    return <p>{timeRemaining}</p>;
};

function QuoteForm() {
    const [quoteData, setQuoteData] = useState(null);
    const [formError, setFormError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [baseAmount, setBaseAmount] = useState(10);
    const baseAmountDebounced = useDebouncedCallback((value) => {
        value = Number(value);
        if (isNaN(value) || value > 999 || value < 3) {
            setFormError('El monto debe estar entre 3 y 999');
            return;
        }
        setBaseAmount(value);
    }, 500);
    const [debouncedBaseAmount] = useDebounce(baseAmount);

    const [baseCurrency] = useState('USD');
    const [quoteCurrency, setQuoteCurrency] = useState('MXN');

    const fetchQuoteData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
            console.log(`Fetching quote data for ${baseCurrency} ${quoteCurrency} ${baseAmount}`);
            const response = await fetch(`${API_URL}/quotes?base_currency=${baseCurrency}&quote_currency=${quoteCurrency}&amount=${baseAmount}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer fake-jwt-token',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const { data } = await response.json();
            setQuoteData(data);
            localStorage.setItem('quote_id', data.quote_id);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuoteData();
    }, [debouncedBaseAmount, quoteCurrency]);

    const handleQuoteCurrencyChange = (selectedOption) => {
        setQuoteCurrency(selectedOption.value);
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        if (!quoteData || formError) return;
        alert('Tu envío de dinero ha sido procesado.');
    };

    if (!quoteData) {
        return null;
    }

    return (
        <div className="quote-form">
            <span className="label">Tu envías exactamente</span>
            <div className="input-group">
                <input
                    type="number"
                    defaultValue={baseAmount}
                    required
                    onChange={(e) => baseAmountDebounced(e.target.value)}
                    data-testid="base-amount-input"
                />
                <div className="currency-select">
                    <img src={getCurrencyFlag(quoteData.base_currency)} alt={quoteData.base_currency} />
                    <span>{baseCurrency}</span>
                </div>
                <Dropdown
                    options={currencyOptions.base}
                    onChange={handleQuoteCurrencyChange}
                    id="base-currency-selector"
                />
            </div>
            {formError && <div style={{ color: '#de5f5f' }}>{formError}</div>}
            <div className="info-group">
                <div className="fees">
                    <div className="fee-item">
                        <span className="value">{formError ? '0' : quoteData.pct_fee}</span>
                        <span className="label"><strong>Percentage quotation fee</strong></span>
                    </div>
                    <div className="fee-item">
                        <span className="value">{formError ? '0' : quoteData.fixed_fee}</span>
                        <span className="label">Fixed quotation fee</span>
                    </div>
                </div>
            </div>
            <hr />
            <div className="info-group">
                {!formError && (
                    <div className="rate-info">
                        <span className="value">{quoteData.quote_amount} {quoteData.quote_currency} = ${quoteData.base_amount} {quoteData.base_currency}</span>
                        <span className="label"><strong>Balam Rate</strong></span>
                    </div>
                )}
                <small>{!formError && <ExpirationTimer expirationTimestamp={quoteData.expiration_ts} />}</small>
            </div>
            <span className="label">Recibes exactamente</span>
            <div className="input-group">
                <input
                    type="text"
                    value={formError || isLoading ? '' : quoteData.quote_amount}
                    readOnly
                />
                <div className="currency-select">
                    <img src={getCurrencyFlag(quoteCurrency)} alt={quoteCurrency} />
                    <span>{quoteCurrency}</span>
                </div>
                <Dropdown
                    options={currencyOptions.quote}
                    onChange={handleQuoteCurrencyChange}
                    dataTestIdDropdown="quote-currency-selector"
                />
            </div>
            <div style={{ marginTop: 10 }}>
                <span className="label">Tu dinero llega en <strong>15 minutos</strong></span>
            </div>
            <button className="send-button" onClick={handleFormSubmit}>Enviar ahora</button>
            <footer>
                <span>Powered by</span>
                <img src={logo} alt="Balam" />
            </footer>
        </div>
    );
}

export default QuoteForm;

