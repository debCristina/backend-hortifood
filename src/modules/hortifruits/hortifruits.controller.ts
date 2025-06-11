import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseFloatPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HortifruitsService } from './hortifruits.service';
import { CreateHortifruitDto } from './dto/create-hortifruit.dto';
import { UpdateHortifruitDto } from './dto/update-hortifruit.dto';
import { PaginationDto } from '../../shared/dtos/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('hortifruits')
@Controller('hortifruits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HortifruitsController {
  constructor(private readonly hortifruitsService: HortifruitsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo hortifruit' })
  @ApiResponse({ status: 201, description: 'Hortifruit criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email ou CNPJ já cadastrado' })
  create(@Body() createHortifruitDto: CreateHortifruitDto) {
    return this.hortifruitsService.create(createHortifruitDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os hortifruits' })
  @ApiResponse({ status: 200, description: 'Lista de hortifruits retornada com sucesso' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.hortifruitsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um hortifruit pelo ID' })
  @ApiResponse({ status: 200, description: 'Hortifruit encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Hortifruit não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.hortifruitsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.HORTIFRUIT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um hortifruit' })
  @ApiResponse({ status: 200, description: 'Hortifruit atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Hortifruit não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHortifruitDto: UpdateHortifruitDto,
  ) {
    return this.hortifruitsService.update(id, updateHortifruitDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um hortifruit' })
  @ApiResponse({ status: 200, description: 'Hortifruit removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Hortifruit não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.hortifruitsService.remove(id);
  }

  @Patch(':id/status')
  @Roles(Role.HORTIFRUIT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status do hortifruit' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Hortifruit não encontrado' })
  updateOperatingStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isOpen') isOpen: boolean,
  ) {
    return this.hortifruitsService.updateOperatingStatus(id, isOpen);
  }

  @Post(':id/ratings')
  @Roles(Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar uma avaliação' })
  @ApiResponse({ status: 201, description: 'Avaliação adicionada com sucesso' })
  @ApiResponse({ status: 400, description: 'Avaliação inválida' })
  @ApiResponse({ status: 404, description: 'Hortifruit não encontrado' })
  addRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rating', ParseFloatPipe) rating: number,
  ) {
    return this.hortifruitsService.addRating(id, rating);
  }
}
