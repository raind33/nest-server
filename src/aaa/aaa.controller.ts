import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { AaaService } from './aaa.service';
import { CreateAaaDto } from './dto/create-aaa.dto';
import { UpdateAaaDto } from './dto/update-aaa.dto';
import { LoginGuard } from 'src/login.guard';
import { PermissionGuard } from 'src/user/permission.guard';
import { RequireLogin, RequirePermission } from 'src/custom-decorator';

@Controller('aaa')
@RequireLogin()
export class AaaController {
  constructor(private readonly aaaService: AaaService) {}

  @Post()
  create(@Body() createAaaDto: CreateAaaDto) {
    return this.aaaService.create(createAaaDto);
  }

  @Get()
  @RequirePermission('查询 aaa')
  findAll() {
    console.log(99999);
    return this.aaaService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAaaDto: UpdateAaaDto) {
    return this.aaaService.update(+id, updateAaaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aaaService.remove(+id);
  }
}
