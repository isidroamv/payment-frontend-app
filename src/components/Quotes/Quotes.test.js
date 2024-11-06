import React, { act} from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import selectEvent from 'react-select-event';

import '@testing-library/jest-dom';
import QuoteForm from './Quotes';
import moment from 'moment';
import fetchMock from 'jest-fetch-mock';

let mockResponse = null;
fetchMock.enableMocks();

beforeEach(() => {
    fetch.resetMocks();
    mockResponse = {
        data: {
            quote_id: '1',
            pct_fee: 0.02,
            fixed_fee: 2.5,
            quote_amount: 200,
            base_amount: 10,
            quote_currency: 'MXN',
            base_currency: 'USD',
            expiration_ts: moment().add(5, 'minutes').toISOString()
        }
    };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));
});

describe('QuoteForm Component', () => {
    test('renders QuoteForm component with initial elements', async () => {
        render(<QuoteForm />);

        // Wait for fetch to complete
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        // Check for initial elements and default values
        expect(await screen.findByText(/tu envías exactamente/i)).toBeInTheDocument();
        expect(await screen.getByText(/recibes exactamente/i)).toBeInTheDocument();
        expect(await screen.getByText(/powered by/i)).toBeInTheDocument();
        expect(await screen.getByText(/percentage quotation fee/i)).toBeInTheDocument();
        expect(await screen.getByText(/fixed quotation fee/i)).toBeInTheDocument();
    });


    test('displays error when input amount is out of bounds', async () => {
        // Wrap asynchronous updates in `act()`
        await act(async () => {
            render(<QuoteForm />);
        });
        
        const inputElement = screen.getByTestId('base-amount-input'); 

        // Test for amount out of bounds
        fireEvent.change(inputElement, { target: { value: '2' } });
        await waitFor(() => expect(screen.getByText(/el monto debe estar entre 3 y 999/i)).toBeInTheDocument());
        
        // Test for amount out of bounds
        fireEvent.change(inputElement, { target: { value: '1000' } });
        await waitFor(() => expect(screen.getByText(/el monto debe estar entre 3 y 999/i)).toBeInTheDocument());

        // Test for valid amount
        fireEvent.change(inputElement, { target: { value: '100' } });
        const expectedUrl = 'http://localhost:3000/api/quotes?base_currency=USD&quote_currency=MXN&amount=100';
        const expectedHeaders = {"headers": {"Authorization": "Bearer fake-jwt-token", "Content-Type": "application/json"}}
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(expectedUrl, expectedHeaders);
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });

    test('handles currency selection and updates quote currency', async () => {
        // Wrap asynchronous updates in `act()`
        await act(async () => {
            render(<QuoteForm />);
        });

        const currencySelect = screen.getByTestId('quote-currency-selector');
        userEvent.click(currencySelect);

        // Use react-select-event to open the dropdown and select an option
        await selectEvent.select(currencySelect, 'Peso Colombiano');

        // // Assert that the correct option is displayed in the input (based on the selected option)
        expect(screen.getByText('COP')).toBeInTheDocument();
    });

    test('calls handleSubmit and prevents form submission when error exists', async () => {
        // Mock the alert function
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
        render(<QuoteForm />);

        // Wait for fetch to complete
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        // Click the submit button
        const submitButton = screen.getByRole('button', { name: /enviar ahora/i });
        fireEvent.click(submitButton);
        
        expect(await alertSpy).toHaveBeenCalledWith('Tu envío de dinero ha sido procesado.');
    });
});
