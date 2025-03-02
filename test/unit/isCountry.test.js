const axios = require('axios');
const { isCountry } = require('../../validationFunctions');

jest.mock('axios');

describe('isCountry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for a valid country', async () => {
    axios.post.mockResolvedValue({ data: { error: false } });

    const result = await isCountry('France');
    expect(result).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(
      'https://countriesnow.space/api/v0.1/countries/currency',
      { country: 'France' }
    );
  });

  it('should return false for an invalid country', async () => {
    axios.post.mockResolvedValue({ data: { error: true } });

    const result = await isCountry('Atlantis');
    expect(result).toBe(false);
  });

  it('should return false if API responds with 404', async () => {
    axios.post.mockRejectedValue({ response: { status: 404 } });

    const result = await isCountry('UnknownLand');
    expect(result).toBe(false);
  });

  it('should throw an error on network failure', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    await expect(isCountry('France')).rejects.toThrow('Network Error');
  });
});
