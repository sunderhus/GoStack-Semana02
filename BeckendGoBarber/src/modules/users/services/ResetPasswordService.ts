import { injectable, inject } from 'tsyringe';
// import AppError from '@shared/errors/AppError';
import AppError from '@shared/errors/AppError';
import { differenceInHours, isAfter, addHours } from 'date-fns';
import IUsersRepository from '../repositories/IUsersRepository';
import IUserTokensRepository from '../repositories/IUserTokensRepository';
import IHashProvider from '../providers/HashProvider/models/IHashProvider';

interface IRequest {
  token: string;
  password: string;
}
@injectable()
class ResetPasswordService {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('UserTokensRepository')
    private userTokensRepository: IUserTokensRepository,

    @inject('HashProvider')
    private hashProvider: IHashProvider
  ) {}

  public async execute({ token, password }: IRequest): Promise<void> {
    const userToken = await this.userTokensRepository.findByToken(token);

    if (!userToken) {
      throw new AppError('User token does not exists.');
    }
    const user = await this.usersRepository.findById(userToken.user_id);

    if (!user) {
      throw new AppError('User  does not exists.');
    }

    const currentDate = new Date(Date.now());
    const tokenCreateAt = userToken.created_at;
    const limitDate = addHours(tokenCreateAt, 2);

    if (isAfter(currentDate, limitDate)) {
      throw new AppError('This token is already expired.');
    }

    if (differenceInHours(currentDate, tokenCreateAt) > 2) {
      throw new AppError('This token is already expired.');
    }
    user.password = await this.hashProvider.generateHash(password);

    await this.usersRepository.save(user);
  }
}

export default ResetPasswordService;
