import { render, screen, fireEvent } from '@testing-library/react';
import ActorInput from '../ActorInput';

describe('ActorInput', () => {
  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnGiveUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('affiche le champ de saisie avec le placeholder', () => {
    render(
      <ActorInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onGiveUp={mockOnGiveUp}
        isGameActive={true}
        isLoading={false}
      />
    );

    expect(screen.getByPlaceholderText(/Entrez le nom d'un acteur/i)).toBeInTheDocument();
  });

  test('affiche les boutons Valider et Abandonner', () => {
    render(
      <ActorInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onGiveUp={mockOnGiveUp}
        isGameActive={true}
        isLoading={false}
      />
    );

    expect(screen.getByText('Valider')).toBeInTheDocument();
    expect(screen.getByText('Abandonner')).toBeInTheDocument();
  });

  test('appelle onChange quand on tape dans le champ', () => {
    render(
      <ActorInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onGiveUp={mockOnGiveUp}
        isGameActive={true}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText(/Entrez le nom d'un acteur/i);
    fireEvent.change(input, { target: { value: 'Brad Pitt' } });

    expect(mockOnChange).toHaveBeenCalledWith('Brad Pitt');
  });

  test('appelle onSubmit quand on clique sur Valider', () => {
    render(
      <ActorInput
        value="Brad Pitt"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onGiveUp={mockOnGiveUp}
        isGameActive={true}
        isLoading={false}
      />
    );

    const button = screen.getByText('Valider');
    fireEvent.click(button);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  test('appelle onGiveUp quand on clique sur Abandonner', () => {
    render(
      <ActorInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onGiveUp={mockOnGiveUp}
        isGameActive={true}
        isLoading={false}
      />
    );

    const button = screen.getByText('Abandonner');
    fireEvent.click(button);

    expect(mockOnGiveUp).toHaveBeenCalledTimes(1);
  });

  test('désactive les boutons quand isLoading est true', () => {
    render(
      <ActorInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onGiveUp={mockOnGiveUp}
        isGameActive={true}
        isLoading={true}
      />
    );

    const validateButton = screen.getByText('Valider');
    const giveUpButton = screen.getByText('Abandonner');

    expect(validateButton).toBeDisabled();
    expect(giveUpButton).toBeDisabled();
  });

  test('désactive les boutons quand isGameActive est false', () => {
    render(
      <ActorInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onGiveUp={mockOnGiveUp}
        isGameActive={false}
        isLoading={false}
      />
    );

    const validateButton = screen.getByText('Valider');
    const giveUpButton = screen.getByText('Abandonner');

    expect(validateButton).toBeDisabled();
    expect(giveUpButton).toBeDisabled();
  });
});
