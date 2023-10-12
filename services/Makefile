ifeq (up,$(firstword $(MAKECMDGOALS)))
  UP_ARGS := $(patsubst %,$(PREFIX)-%, $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS)))
  $(eval $(UP_ARGS):;@:)
endif

up:
	docker-compose -f docker-compose.yaml up $(UP_ARGS)