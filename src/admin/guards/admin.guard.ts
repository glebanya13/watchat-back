import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.uid) {
      throw new ForbiddenException('User not authenticated');
    }

    const userData = await this.usersService.getUserById(user.uid);
    if (!userData || !userData.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

