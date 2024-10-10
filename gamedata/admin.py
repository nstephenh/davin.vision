from django.contrib import admin

from gamedata.models import Game, GameEdition, GameCharacteristic, ProfileType, Profile

admin.site.register(Game)
admin.site.register(GameEdition)
admin.site.register(GameCharacteristic)
admin.site.register(ProfileType)
admin.site.register(Profile)
